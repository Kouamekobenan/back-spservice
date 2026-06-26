import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DailyReportData {
  shopName: string;
  date: string;
  totalRevenue: number;
  totalSales: number;
  cogs: number;
  grossMargin: number;
  grossMarginPct: number;
  totalExpenses: number;
  netRevenue: number;
  topProducts: { name: string; qty: number; revenue: number; cost: number; margin: number }[];
  lowStockProducts: { name: string; stock: number; unit: string }[];
  paymentBreakdown: { method: string; amount: number; count: number }[];
}

export interface WeeklyReportData {
  shopName: string;
  weekLabel: string;
  currentWeek: { revenue: number; sales: number; cogs: number; grossMargin: number; expenses: number; netRevenue: number };
  previousWeek: { revenue: number; sales: number; cogs: number; grossMargin: number; expenses: number; netRevenue: number };
  revenueGrowth: number;
  marginGrowth: number;
  salesGrowth: number;
  topProducts: { name: string; qty: number; revenue: number; margin: number }[];
  dailyBreakdown: { day: string; revenue: number; sales: number; margin: number }[];
}

export interface MonthlyReportData {
  shopName: string;
  monthLabel: string;
  currentMonth: { revenue: number; sales: number; cogs: number; grossMargin: number; grossMarginPct: number; expenses: number; netRevenue: number };
  previousMonth: { revenue: number; sales: number; cogs: number; grossMargin: number; expenses: number; netRevenue: number };
  revenueGrowth: number;
  marginGrowth: number;
  topProducts: { name: string; qty: number; revenue: number; margin: number }[];
  topCategories: { name: string; revenue: number; margin: number }[];
  weeklyBreakdown: { week: string; revenue: number; sales: number; margin: number }[];
  lowStockProducts: { name: string; stock: number; unit: string }[];
}

function calcCogs(items: { quantity: any; product: { buyingPrice: any } }[]): number {
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.buyingPrice), 0);
}

@Injectable()
export class ReportDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyReport(shopId: string, forDate?: Date): Promise<DailyReportData> {
    const now = forDate ?? new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    const [sales, expenses, products] = await Promise.all([
      this.prisma.sale.findMany({
        where: { shopId, createdAt: { gte: startOfDay, lt: endOfDay }, status: 'COMPLETED' },
        include: { items: { include: { product: true } }, payments: true },
      }),
      this.prisma.expense.findMany({ where: { shopId, date: { gte: startOfDay, lt: endOfDay } } }),
      this.prisma.product.findMany({ where: { shopId, isActive: true }, include: { unit: true } }),
    ]);

    const totalRevenue = sales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const cogs = sales.reduce((s, sale) => s + calcCogs(sale.items), 0);
    const grossMargin = totalRevenue - cogs;
    const netRevenue = grossMargin - totalExpenses;
    const grossMarginPct = totalRevenue > 0 ? Math.round((grossMargin / totalRevenue) * 100) : 0;

    // Top 5 produits
    const productMap = new Map<string, { name: string; qty: number; revenue: number; cost: number; margin: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const itemCost = Number(item.quantity) * Number(item.product.buyingPrice);
        const existing = productMap.get(item.productId) ?? { name: item.product.name, qty: 0, revenue: 0, cost: 0, margin: 0 };
        existing.qty += Number(item.quantity);
        existing.revenue += Number(item.totalPrice);
        existing.cost += itemCost;
        existing.margin = existing.revenue - existing.cost;
        productMap.set(item.productId, existing);
      }
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ name: p.name, qty: Math.round(p.qty * 100) / 100, revenue: Math.round(p.revenue), cost: Math.round(p.cost), margin: Math.round(p.margin) }));

    // Stock bas
    const lowStockProducts = products
      .filter((p) => Number(p.stockQty) <= Number(p.minStockQty ?? 5))
      .map((p) => ({ name: p.name, stock: Math.round(Number(p.stockQty) * 100) / 100, unit: p.unit?.name ?? 'unité' }))
      .slice(0, 10);

    // Répartition paiements
    const paymentMap = new Map<string, { method: string; amount: number; count: number }>();
    for (const sale of sales) {
      for (const payment of sale.payments) {
        const existing = paymentMap.get(payment.method) ?? { method: payment.method, amount: 0, count: 0 };
        existing.amount += Number(payment.amount);
        existing.count += 1;
        paymentMap.set(payment.method, existing);
      }
    }

    return {
      shopName: shop?.name ?? 'Boutique',
      date: startOfDay.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalRevenue: Math.round(totalRevenue),
      totalSales: sales.length,
      cogs: Math.round(cogs),
      grossMargin: Math.round(grossMargin),
      grossMarginPct,
      totalExpenses: Math.round(totalExpenses),
      netRevenue: Math.round(netRevenue),
      topProducts,
      lowStockProducts,
      paymentBreakdown: [...paymentMap.values()].map((p) => ({ ...p, amount: Math.round(p.amount) })),
    };
  }

  async getWeeklyReport(shopId: string): Promise<WeeklyReportData> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);
    const endOfThisWeek = new Date(startOfThisWeek.getTime() + 7 * 86400000);

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    const [thisWeekSales, lastWeekSales, thisWeekExpenses, lastWeekExpenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: { shopId, createdAt: { gte: startOfThisWeek, lt: endOfThisWeek }, status: 'COMPLETED' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.sale.findMany({
        where: { shopId, createdAt: { gte: startOfLastWeek, lt: startOfThisWeek }, status: 'COMPLETED' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.expense.findMany({ where: { shopId, date: { gte: startOfThisWeek, lt: endOfThisWeek } } }),
      this.prisma.expense.findMany({ where: { shopId, date: { gte: startOfLastWeek, lt: startOfThisWeek } } }),
    ]);

    const currentRevenue = thisWeekSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
    const previousRevenue = lastWeekSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
    const currentCogs = thisWeekSales.reduce((s, sale) => s + calcCogs(sale.items), 0);
    const previousCogs = lastWeekSales.reduce((s, sale) => s + calcCogs(sale.items), 0);
    const currentGrossMargin = currentRevenue - currentCogs;
    const previousGrossMargin = previousRevenue - previousCogs;
    const currentExpenses = thisWeekExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const previousExpenses = lastWeekExpenses.reduce((s, e) => s + Number(e.amount), 0);

    const revenueGrowth = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    const marginGrowth = previousGrossMargin > 0 ? Math.round(((currentGrossMargin - previousGrossMargin) / previousGrossMargin) * 100) : 0;
    const salesGrowth = lastWeekSales.length > 0 ? Math.round(((thisWeekSales.length - lastWeekSales.length) / lastWeekSales.length) * 100) : 0;

    // Top produits semaine
    const productMap = new Map<string, { name: string; qty: number; revenue: number; cost: number; margin: number }>();
    for (const sale of thisWeekSales) {
      for (const item of sale.items) {
        const itemCost = Number(item.quantity) * Number(item.product.buyingPrice);
        const existing = productMap.get(item.productId) ?? { name: item.product.name, qty: 0, revenue: 0, cost: 0, margin: 0 };
        existing.qty += Number(item.quantity);
        existing.revenue += Number(item.totalPrice);
        existing.cost += itemCost;
        existing.margin = existing.revenue - existing.cost;
        productMap.set(item.productId, existing);
      }
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ name: p.name, qty: Math.round(p.qty * 100) / 100, revenue: Math.round(p.revenue), margin: Math.round(p.margin) }));

    // Breakdown journalier
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dailyBreakdown = days.map((day, i) => {
      const dayStart = new Date(startOfThisWeek.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const daySales = thisWeekSales.filter((s) => new Date(s.createdAt) >= dayStart && new Date(s.createdAt) < dayEnd);
      const dayRevenue = daySales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
      const dayCogs = daySales.reduce((s, sale) => s + calcCogs(sale.items), 0);
      return { day, revenue: Math.round(dayRevenue), sales: daySales.length, margin: Math.round(dayRevenue - dayCogs) };
    });

    return {
      shopName: shop?.name ?? 'Boutique',
      weekLabel: `Semaine du ${startOfThisWeek.toLocaleDateString('fr-FR')}`,
      currentWeek: {
        revenue: Math.round(currentRevenue), sales: thisWeekSales.length,
        cogs: Math.round(currentCogs), grossMargin: Math.round(currentGrossMargin),
        expenses: Math.round(currentExpenses), netRevenue: Math.round(currentGrossMargin - currentExpenses),
      },
      previousWeek: {
        revenue: Math.round(previousRevenue), sales: lastWeekSales.length,
        cogs: Math.round(previousCogs), grossMargin: Math.round(previousGrossMargin),
        expenses: Math.round(previousExpenses), netRevenue: Math.round(previousGrossMargin - previousExpenses),
      },
      revenueGrowth, marginGrowth, salesGrowth, topProducts, dailyBreakdown,
    };
  }

  async getMonthlyReport(shopId: string, month?: number, year?: number): Promise<MonthlyReportData> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth(); // month param is 1-based
    const startOfThisMonth = new Date(targetYear, targetMonth, 1);
    const startOfNextMonth = new Date(targetYear, targetMonth + 1, 1);
    const startOfLastMonth = new Date(targetYear, targetMonth - 1, 1);

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });

    const [thisMonthSales, lastMonthSales, thisMonthExpenses, lastMonthExpenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: { shopId, createdAt: { gte: startOfThisMonth, lt: startOfNextMonth }, status: 'COMPLETED' },
        include: { items: { include: { product: { include: { category: true } } } } },
      }),
      this.prisma.sale.findMany({
        where: { shopId, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth }, status: 'COMPLETED' },
        include: { items: { include: { product: true } } },
      }),
      this.prisma.expense.findMany({ where: { shopId, date: { gte: startOfThisMonth, lt: startOfNextMonth } } }),
      this.prisma.expense.findMany({ where: { shopId, date: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
    ]);

    const currentRevenue = thisMonthSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
    const previousRevenue = lastMonthSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
    const currentCogs = thisMonthSales.reduce((s, sale) => s + calcCogs(sale.items), 0);
    const previousCogs = lastMonthSales.reduce((s, sale) => s + calcCogs(sale.items), 0);
    const currentGrossMargin = currentRevenue - currentCogs;
    const previousGrossMargin = previousRevenue - previousCogs;
    const currentExpenses = thisMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const previousExpenses = lastMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const grossMarginPct = currentRevenue > 0 ? Math.round((currentGrossMargin / currentRevenue) * 100) : 0;

    const revenueGrowth = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    const marginGrowth = previousGrossMargin > 0 ? Math.round(((currentGrossMargin - previousGrossMargin) / previousGrossMargin) * 100) : 0;

    // Top produits + catégories
    const productMap = new Map<string, { name: string; qty: number; revenue: number; cost: number; margin: number }>();
    const categoryMap = new Map<string, { name: string; revenue: number; cost: number; margin: number }>();
    for (const sale of thisMonthSales) {
      for (const item of sale.items) {
        const itemCost = Number(item.quantity) * Number(item.product.buyingPrice);
        const p = productMap.get(item.productId) ?? { name: item.product.name, qty: 0, revenue: 0, cost: 0, margin: 0 };
        p.qty += Number(item.quantity); p.revenue += Number(item.totalPrice); p.cost += itemCost; p.margin = p.revenue - p.cost;
        productMap.set(item.productId, p);

        if (item.product.categoryId && item.product.category) {
          const cat = categoryMap.get(item.product.categoryId) ?? { name: item.product.category.name, revenue: 0, cost: 0, margin: 0 };
          cat.revenue += Number(item.totalPrice); cat.cost += itemCost; cat.margin = cat.revenue - cat.cost;
          categoryMap.set(item.product.categoryId, cat);
        }
      }
    }

    // Breakdown par semaine
    const weeklyBreakdown: { week: string; revenue: number; sales: number; margin: number }[] = [];
    for (let w = 0; w < 5; w++) {
      const wStart = new Date(startOfThisMonth.getTime() + w * 7 * 86400000);
      const wEnd = new Date(wStart.getTime() + 7 * 86400000);
      if (wStart >= startOfNextMonth) break;
      const wSales = thisMonthSales.filter((s) => new Date(s.createdAt) >= wStart && new Date(s.createdAt) < wEnd);
      const wRevenue = wSales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
      const wCogs = wSales.reduce((s, sale) => s + calcCogs(sale.items), 0);
      weeklyBreakdown.push({ week: `Sem. ${w + 1}`, revenue: Math.round(wRevenue), sales: wSales.length, margin: Math.round(wRevenue - wCogs) });
    }

    // Stock bas
    const products = await this.prisma.product.findMany({ where: { shopId, isActive: true }, include: { unit: true } });
    const lowStockProducts = products
      .filter((p) => Number(p.stockQty) <= Number(p.minStockQty ?? 5))
      .map((p) => ({ name: p.name, stock: Math.round(Number(p.stockQty) * 100) / 100, unit: p.unit?.name ?? 'unité' }))
      .slice(0, 10);

    return {
      shopName: shop?.name ?? 'Boutique',
      monthLabel: startOfThisMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      currentMonth: {
        revenue: Math.round(currentRevenue), sales: thisMonthSales.length,
        cogs: Math.round(currentCogs), grossMargin: Math.round(currentGrossMargin), grossMarginPct,
        expenses: Math.round(currentExpenses), netRevenue: Math.round(currentGrossMargin - currentExpenses),
      },
      previousMonth: {
        revenue: Math.round(previousRevenue), sales: lastMonthSales.length,
        cogs: Math.round(previousCogs), grossMargin: Math.round(previousGrossMargin),
        expenses: Math.round(previousExpenses), netRevenue: Math.round(previousGrossMargin - previousExpenses),
      },
      revenueGrowth, marginGrowth,
      topProducts: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        .map((p) => ({ name: p.name, qty: Math.round(p.qty * 100) / 100, revenue: Math.round(p.revenue), margin: Math.round(p.margin) })),
      topCategories: [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
        .map((c) => ({ name: c.name, revenue: Math.round(c.revenue), margin: Math.round(c.margin) })),
      weeklyBreakdown, lowStockProducts,
    };
  }
}
