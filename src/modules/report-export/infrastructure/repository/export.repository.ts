import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';

export interface ShopInfo {
  name: string;
  address: string | null;
  phone: string | null;
  currency: string;
}

// ── Types de données pour chaque rapport ─────────────────────────────────────

export interface SaleRow {
  receiptNumber: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  paymentMethods: string;
  itemCount: number;
  cashierName: string;
  customerName: string | null;
}

export interface SalesSummary {
  totalRevenue: number;
  totalPaid: number;
  totalDiscounts: number;
  transactionCount: number;
  voidedCount: number;
  averageBasket: number;
  paymentBreakdown: Array<{ method: string; amount: number; count: number }>;
}

export interface SalesReportData {
  shop: ShopInfo;
  from: Date;
  to: Date;
  summary: SalesSummary;
  sales: SaleRow[];
}

export interface FinancialReportData {
  shop: ShopInfo;
  from: Date;
  to: Date;
  revenue: { gross: number; discounts: number; net: number };
  cogs: number;
  grossMargin: number;
  grossMarginRate: number;
  expenses: { total: number; byCategory: Array<{ category: string; amount: number }> };
  netResult: number;
  isProfit: boolean;
}

export interface StockRow {
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryName: string | null;
  unitName: string | null;
  stockQty: number;
  minStockQty: number;
  buyingPrice: number;
  sellingPrice: number;
  stockValue: number;
  status: 'OK' | 'LOW' | 'OUT';
}

export interface StockReportData {
  shop: ShopInfo;
  generatedAt: Date;
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  products: StockRow[];
}

export interface DebtRow {
  name: string;
  phone: string | null;
  totalDebt: number;
  creditLimit: number | null;
  isOverLimit: boolean;
}

export interface DebtsReportData {
  shop: ShopInfo;
  generatedAt: Date;
  summary: { totalCustomers: number; totalDebt: number; overLimitCount: number };
  customers: DebtRow[];
}

// ── Repository ────────────────────────────────────────────────────────────────

@Injectable()
export class ExportRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Infos boutique ────────────────────────────────────────────────────

  async getShopInfo(shopId: string): Promise<ShopInfo> {
    const shop = await this.prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
    return { name: shop.name, address: shop.address, phone: shop.phone, currency: shop.currency };
  }

  // ── Rapport des ventes ────────────────────────────────────────────────

  async getSalesReportData(shopId: string, from: Date, to: Date, userId?: string): Promise<SalesReportData> {
    const shop = await this.getShopInfo(shopId);

    const where: any = {
      shopId,
      createdAt: { gte: from, lte: to },
      ...(userId ? { userId } : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      select: {
        id:             true,
        receiptNumber:  true,
        status:         true,
        totalAmount:    true,
        paidAmount:     true,
        discountAmount: true,
        createdAt:      true,
        payments:  { select: { method: true, amount: true } },
        items:     { select: { id: true } },
        user:      { select: { name: true } },
        customer:  { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000, // sécurité anti-OOM : max 5 000 lignes par export
    });

    const completed = sales.filter((s) => ['COMPLETED', 'PARTIALLY_PAID'].includes(s.status));
    const totalRevenue   = completed.reduce((a, s) => a + Number(s.totalAmount), 0);
    const totalPaid      = completed.reduce((a, s) => a + Number(s.paidAmount), 0);
    const totalDiscounts = completed.reduce((a, s) => a + Number(s.discountAmount), 0);
    const voidedCount    = sales.filter((s) => s.status === 'VOIDED').length;

    // Répartition par mode de paiement
    const methodMap = new Map<string, { amount: number; count: number }>();
    for (const sale of completed) {
      for (const p of sale.payments) {
        const entry = methodMap.get(p.method) ?? { amount: 0, count: 0 };
        entry.amount += Number(p.amount);
        entry.count  += 1;
        methodMap.set(p.method, entry);
      }
    }

    const rows: SaleRow[] = sales.map((s) => ({
      receiptNumber: s.receiptNumber,
      createdAt:     s.createdAt,
      status:        s.status,
      totalAmount:   Number(s.totalAmount),
      paidAmount:    Number(s.paidAmount),
      discountAmount: Number(s.discountAmount),
      paymentMethods: [...new Set(s.payments.map((p) => p.method))].join(', '),
      itemCount:     s.items.length,
      cashierName:   s.user.name,
      customerName:  s.customer?.name ?? null,
    }));

    return {
      shop,
      from,
      to,
      summary: {
        totalRevenue,
        totalPaid,
        totalDiscounts,
        transactionCount: completed.length,
        voidedCount,
        averageBasket: completed.length > 0 ? totalRevenue / completed.length : 0,
        paymentBreakdown: [...methodMap.entries()].map(([method, v]) => ({
          method,
          amount: v.amount,
          count:  v.count,
        })),
      },
      sales: rows,
    };
  }

  // ── Rapport financier ─────────────────────────────────────────────────

  async getFinancialReportData(shopId: string, from: Date, to: Date): Promise<FinancialReportData> {
    const shop = await this.getShopInfo(shopId);

    const [salesAgg, soldItems, expensesAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { shopId, status: { in: ['COMPLETED', 'PARTIALLY_PAID'] }, createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { shopId, status: { in: ['COMPLETED', 'PARTIALLY_PAID'] }, createdAt: { gte: from, lte: to } } },
        include: { product: { select: { buyingPrice: true } } },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: { shopId, date: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
    ]);

    const grossRevenue = Number(salesAgg._sum.totalAmount ?? 0);
    const discounts    = Number(salesAgg._sum.discountAmount ?? 0);
    const netRevenue   = grossRevenue;
    const cogs         = soldItems.reduce((a, i) => a + Number(i.product.buyingPrice) * Number(i.quantity), 0);
    const grossMargin  = netRevenue - cogs;
    const totalExpenses = expensesAgg.reduce((a, e) => a + Number(e._sum.amount ?? 0), 0);
    const netResult    = grossMargin - totalExpenses;

    return {
      shop,
      from,
      to,
      revenue: { gross: grossRevenue + discounts, discounts, net: grossRevenue },
      cogs,
      grossMargin,
      grossMarginRate: netRevenue > 0 ? (grossMargin / netRevenue) * 100 : 0,
      expenses: {
        total: totalExpenses,
        byCategory: expensesAgg.map((e) => ({
          category: e.category,
          amount:   Number(e._sum.amount ?? 0),
        })),
      },
      netResult,
      isProfit: netResult >= 0,
    };
  }

  // ── Rapport de stock ──────────────────────────────────────────────────

  async getStockReportData(
    shopId: string,
    categoryId?: string,
    stockFilter?: 'all' | 'low' | 'out',
  ): Promise<StockReportData> {
    const shop = await this.getShopInfo(shopId);

    const where: any = { shopId, isActive: true, ...(categoryId ? { categoryId } : {}) };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        unit:     { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const rows: StockRow[] = products.map((p) => {
      const qty      = Number(p.stockQty);
      const minQty   = Number(p.minStockQty);
      const buyPrice = Number(p.buyingPrice);
      const status: 'OK' | 'LOW' | 'OUT' =
        qty <= 0 ? 'OUT' : qty <= minQty ? 'LOW' : 'OK';

      return {
        name:         p.name,
        sku:          p.sku,
        barcode:      p.barcode,
        categoryName: p.category?.name ?? null,
        unitName:     p.unit?.name ?? null,
        stockQty:     qty,
        minStockQty:  minQty,
        buyingPrice:  buyPrice,
        sellingPrice: Number(p.sellingPrice),
        stockValue:   qty * buyPrice,
        status,
      };
    });

    const filtered =
      stockFilter === 'low'
        ? rows.filter((r) => r.status === 'LOW')
        : stockFilter === 'out'
          ? rows.filter((r) => r.status === 'OUT')
          : rows;

    const totalStockValue = rows.reduce((a, r) => a + r.stockValue, 0);

    return {
      shop,
      generatedAt: new Date(),
      summary: {
        totalProducts:  rows.length,
        totalStockValue,
        lowStockCount:  rows.filter((r) => r.status === 'LOW').length,
        outOfStockCount: rows.filter((r) => r.status === 'OUT').length,
      },
      products: filtered,
    };
  }

  // ── Rapport des créances clients ──────────────────────────────────────

  async getDebtsReportData(shopId: string): Promise<DebtsReportData> {
    const shop = await this.getShopInfo(shopId);

    const customers = await this.prisma.customer.findMany({
      where: { totalDebt: { gt: 0 } },
      orderBy: { totalDebt: 'desc' },
    });

    const rows: DebtRow[] = customers.map((c) => ({
      name:        c.name,
      phone:       c.phone,
      totalDebt:   Number(c.totalDebt),
      creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
      isOverLimit: c.creditLimit ? Number(c.totalDebt) > Number(c.creditLimit) : false,
    }));

    const totalDebt = rows.reduce((a, r) => a + r.totalDebt, 0);

    return {
      shop,
      generatedAt: new Date(),
      summary: {
        totalCustomers: rows.length,
        totalDebt,
        overLimitCount: rows.filter((r) => r.isOverLimit).length,
      },
      customers: rows,
    };
  }
}
