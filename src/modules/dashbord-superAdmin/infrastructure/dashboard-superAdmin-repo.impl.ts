// ================================================================
// INFRASTRUCTURE LAYER — Prisma Repository Implementations
// Implémentation concrète des ports définis dans le domaine.
// C'est ici que Prisma et le SQL vivent. NULLE PART AILLEURS.
// ================================================================

import { Injectable } from '@nestjs/common';
import { IAlertRepository, ICashierRepository, ICustomerRepository, IExpenseRepository, ISalesRepository, IShopRepository, RawCashierSales, RawCashierSession, RawSalePoint, RawSalesAgg, RawShopSalesBatch, RawSoldItem } from '../domain/interface/dashboard-superAdmin.repo';
import { PrismaService } from 'src/prisma/prisma.service';
import { Period, ShopFilter } from '../domain/entities/dashbord-superAdmin';


// ================================================================
// PrismaService (wrapper NestJS autour du PrismaClient)
// ================================================================

// ── Sales Repository ────────────────────────────────────────────

@Injectable()
export class PrismaSalesRepository implements ISalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAggregatedSales(
    period: Period,
    filter: ShopFilter,
  ): Promise<{ current: RawSalesAgg; previous: RawSalesAgg }> {
    const shopWhere = filter.toPrismaWhere();

    const [current, previous] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          ...shopWhere,
          status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
          createdAt: {
            gte: period.current.from,
            lte: period.current.to,
          },
        },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          ...shopWhere,
          status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
          createdAt: {
            gte: period.previous.from,
            lte: period.previous.to,
          },
        },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
    ]);

    const toRaw = (agg: typeof current): RawSalesAgg => ({
      totalAmount: Number(agg._sum?.totalAmount ?? 0),
      discountAmount: Number(agg._sum?.discountAmount ?? 0),
      taxAmount: Number(agg._sum?.taxAmount ?? 0),
      transactionCount: agg._count?.id ?? 0,
    });

    return { current: toRaw(current), previous: toRaw(previous) };
  }

  // ── Batch métriques par boutique (évite N×queries dans GetShopsPerformanceUseCase) ──

  async getShopsMetricsBatch(
    period: Period,
    shopIds?: string[],
  ): Promise<{ current: RawShopSalesBatch[]; previous: RawShopSalesBatch[] }> {
    const shopWhere = shopIds ? { shopId: { in: shopIds } } : {};

    // 1. Agrégats courant + précédent en parallèle (2 queries groupBy)
    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['shopId'],
        where: { ...shopWhere, status: { in: ['COMPLETED', 'PARTIALLY_PAID'] }, createdAt: { gte: period.current.from, lte: period.current.to } },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.groupBy({
        by: ['shopId'],
        where: { ...shopWhere, status: { in: ['COMPLETED', 'PARTIALLY_PAID'] }, createdAt: { gte: period.previous.from, lte: period.previous.to } },
        _sum: { totalAmount: true, discountAmount: true, taxAmount: true },
        _count: { id: true },
      }),
    ]);

    // 2. COGS par boutique — saleItem.findMany minimal (1 query)
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          ...shopWhere,
          status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
          createdAt: { gte: period.current.from, lte: period.current.to },
        },
      },
      select: {
        quantity: true,
        sale:    { select: { shopId: true } },
        product: { select: { buyingPrice: true } },
      },
    });

    const cogsByShop: Record<string, number> = {};
    for (const item of saleItems) {
      const sid = item.sale.shopId;
      cogsByShop[sid] = (cogsByShop[sid] ?? 0) + Number(item.product.buyingPrice) * Number(item.quantity);
    }

    const toRow = (row: (typeof currentAgg)[0]): RawShopSalesBatch => ({
      shopId:           row.shopId,
      totalAmount:      Number(row._sum.totalAmount ?? 0),
      discountAmount:   Number(row._sum.discountAmount ?? 0),
      taxAmount:        Number(row._sum.taxAmount ?? 0),
      transactionCount: row._count.id,
      cogs:             cogsByShop[row.shopId] ?? 0,
    });

    const prevToRow = (row: (typeof previousAgg)[0]): RawShopSalesBatch => ({
      shopId:           row.shopId,
      totalAmount:      Number(row._sum.totalAmount ?? 0),
      discountAmount:   Number(row._sum.discountAmount ?? 0),
      taxAmount:        Number(row._sum.taxAmount ?? 0),
      transactionCount: row._count.id,
      cogs:             0, // COGS précédent non requis pour l'affichage shops
    });

    return {
      current:  currentAgg.map(toRow),
      previous: previousAgg.map(prevToRow),
    };
  }

  async getSoldItemsWithCost(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawSoldItem[]> {
    const shopWhere = filter.toPrismaWhere();

    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          ...shopWhere,
          status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
          createdAt: {
            gte: period.current.from,
            lte: period.current.to,
          },
        },
      },
      select: {
        productId: true,
        quantity: true,
        totalPrice: true,
        productName: true,
        product: {
          select: {
            buyingPrice: true,
            categoryId: true,
            category: {
              select: { id: true, name: true, colorHex: true },
            },
          },
        },
      },
    });

    return items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      totalPrice: Number(item.totalPrice),
      buyingPrice: Number(item.product.buyingPrice),
      categoryId: item.product.categoryId,
      categoryName: item.product.category?.name ?? null,
      categoryColor: item.product.category?.colorHex ?? null,
      productName: item.productName,
    }));
  }

  async getSalesTimeline(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawSalePoint[]> {
    const shopWhere = filter.toPrismaWhere();

    const sales = await this.prisma.sale.findMany({
      where: {
        ...shopWhere,
        status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
        createdAt: {
          gte: period.current.from,
          lte: period.current.to,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        shopId: true,
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return sales.map((s) => ({
      createdAt: s.createdAt,
      totalAmount: Number(s.totalAmount),
      shopId: s.shopId,
      shopName: s.shop.name,
    }));
  }

  async getTodayVoidRate(): Promise<{ total: number; voided: number }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, voided] = await Promise.all([
      this.prisma.sale.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.sale.count({
        where: { status: 'VOIDED', createdAt: { gte: todayStart } },
      }),
    ]);

    return { total, voided };
  }
}

// ── Shop Repository ─────────────────────────────────────────────

@Injectable()
export class PrismaShopRepository implements IShopRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.shop.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true, currency: true },
    });
  }

  async countActive(): Promise<number> {
    return this.prisma.shop.count({ where: { isActive: true } });
  }
}

// ── Cashier Repository ──────────────────────────────────────────

@Injectable()
export class PrismaCashierRepository implements ICashierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesByUser(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawCashierSales[]> {
    const shopWhere = filter.toPrismaWhere();

    const [completed, voided] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['userId', 'shopId'],
        where: {
          ...shopWhere,
          status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
          createdAt: {
            gte: period.current.from,
            lte: period.current.to,
          },
        },
        _sum: { totalAmount: true, discountAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.groupBy({
        by: ['userId'],
        where: {
          ...shopWhere,
          status: 'VOIDED',
          createdAt: {
            gte: period.current.from,
            lte: period.current.to,
          },
        },
        _count: { id: true },
      }),
    ]);

    const voidMap = new Map(voided.map((v) => [v.userId, v._count.id]));

    return completed.map((row) => ({
      userId: row.userId,
      shopId: row.shopId,
      totalAmount: Number(row._sum.totalAmount ?? 0),
      discountAmount: Number(row._sum.discountAmount ?? 0),
      transactionCount: row._count.id,
      voidedCount: voidMap.get(row.userId) ?? 0,
    }));
  }

  async getSessionsByUser(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawCashierSession[]> {
    const shopWhere = filter.toPrismaWhere();

    const sessions = await this.prisma.cashSession.findMany({
      where: {
        ...shopWhere,
        openedAt: {
          gte: period.current.from,
          lte: period.current.to,
        },
        closedAt: { not: null },
      },
      select: {
        userId: true,
        openedAt: true,
        closedAt: true,
        difference: true,
      },
    });

    // Agrégation manuelle par utilisateur
    const userMap = new Map<
      string,
      { totalMinutes: number; sessionCount: number; totalDifference: number }
    >();

    for (const session of sessions) {
      if (!session.closedAt) continue;
      const minutes =
        (session.closedAt.getTime() - session.openedAt.getTime()) / 60000;

      if (!userMap.has(session.userId)) {
        userMap.set(session.userId, {
          totalMinutes: 0,
          sessionCount: 0,
          totalDifference: 0,
        });
      }

      const entry = userMap.get(session.userId)!;
      entry.totalMinutes += minutes;
      entry.sessionCount += 1;
      entry.totalDifference += Number(session.difference ?? 0);
    }

    return [...userMap.entries()].map(([userId, data]) => ({
      userId,
      ...data,
    }));
  }

  async getUsersByIds(userIds: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        shopAccesses: {
          include: { shop: { select: { id: true, name: true } } },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      shopAccesses: u.shopAccesses.map((a) => ({
        shopId: a.shopId,
        shopName: a.shop.name,
      })),
    }));
  }
}

// ── Expense Repository ──────────────────────────────────────────

@Injectable()
export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAggregatedExpenses(
    period: Period,
    filter: ShopFilter,
  ): Promise<{
    total: number;
    previous: number;
    byCategory: Array<{ category: string; amount: number }>;
  }> {
    const shopWhere = filter.toPrismaWhere();

    const [byCategory, previous] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          ...shopWhere,
          date: {
            gte: period.current.from,
            lte: period.current.to,
          },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.expense.aggregate({
        where: {
          ...shopWhere,
          date: {
            gte: period.previous.from,
            lte: period.previous.to,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const formattedCategories = byCategory.map((e) => ({
      category: e.category,
      amount: Number(e._sum.amount ?? 0),
    }));

    const total = formattedCategories.reduce((a, e) => a + e.amount, 0);

    return {
      total,
      previous: Number(previous._sum.amount ?? 0),
      byCategory: formattedCategories,
    };
  }

  async getExpensesByShopBatch(
    period: Period,
    shopIds?: string[],
  ): Promise<Record<string, number>> {
    const shopWhere = shopIds ? { shopId: { in: shopIds } } : {};

    const rows = await this.prisma.expense.groupBy({
      by: ['shopId'],
      where: { ...shopWhere, date: { gte: period.current.from, lte: period.current.to } },
      _sum: { amount: true },
    });

    return Object.fromEntries(rows.map((r) => [r.shopId, Number(r._sum.amount ?? 0)]));
  }
}

// ── Customer Repository ─────────────────────────────────────────

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCreditOutstanding() {
    const result = await this.prisma.customer.aggregate({
      _sum: { totalDebt: true },
      _count: { id: true },
      where: { totalDebt: { gt: 0 } },
    });

    return {
      totalDebt: Number(result._sum.totalDebt ?? 0),
      customersCount: result._count.id,
    };
  }

  async countNewCustomers(period: Period): Promise<number> {
    return this.prisma.customer.count({
      where: {
        createdAt: {
          gte: period.current.from,
          lte: period.current.to,
        },
      },
    });
  }

  async getHighDebtCustomers(threshold: number) {
    const customers = await this.prisma.customer.findMany({
      where: { totalDebt: { gt: threshold } },
      select: {
        id: true,
        name: true,
        phone: true,
        totalDebt: true,
        creditLimit: true,
      },
      orderBy: { totalDebt: 'desc' },
      take: 10,
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalDebt: Number(c.totalDebt),
      creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
    }));
  }
}

// ── Alert Repository ────────────────────────────────────────────

@Injectable()
export class PrismaAlertRepository implements IAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getLowStockProducts(limit = 20) {
    // Raw query nécessaire pour comparer deux colonnes du même record
    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        stockQty: number;
        minStockQty: number;
        shopId: string;
        shopName: string;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        CAST(p."stockQty" AS FLOAT) as "stockQty",
        CAST(p."minStockQty" AS FLOAT) as "minStockQty",
        s.id as "shopId",
        s.name as "shopName"
      FROM products p
      JOIN shops s ON s.id = p."shopId"
      WHERE p."isActive" = true 
        AND p."stockQty" <= p."minStockQty"
      ORDER BY p."stockQty" ASC
      LIMIT ${limit}
    `;

    return results;
  }

  async getUnclosedSessions() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.cashSession.findMany({
      where: {
        closedAt: null,
        openedAt: { lt: yesterday },
      },
      include: {
        user: { select: { name: true } },
        shop: { select: { name: true } },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      shopName: s.shop.name,
      cashierName: s.user.name,
      openedAt: s.openedAt,
    }));
  }

  async getAbnormalCashSessions(thresholdAmount: number, lookbackDays = 7) {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const sessions = await this.prisma.cashSession.findMany({
      where: {
        closedAt: { not: null, gte: since },
        difference: { not: null },
      },
      include: {
        user: { select: { name: true } },
        shop: { select: { name: true } },
      },
      orderBy: { closedAt: 'desc' },
    });

    return sessions
      .filter((s) => Math.abs(Number(s.difference ?? 0)) > thresholdAmount)
      .map((s) => ({
        id: s.id,
        shopName: s.shop.name,
        cashierName: s.user.name,
        difference: Number(s.difference),
        closedAt: s.closedAt!,
      }));
  }

  async getPendingSyncCount() {
    const [pending, errors] = await Promise.all([
      this.prisma.syncQueue.count({
        where: { syncStatus: { in: ['PENDING', 'ERROR'] } },
      }),
      this.prisma.syncQueue.count({
        where: { syncStatus: 'ERROR' },
      }),
    ]);

    return { pending, errors };
  }
}
