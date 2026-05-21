
import { Injectable, Inject } from '@nestjs/common';
import type { IShopRepository, ISalesRepository, IExpenseRepository, ICustomerRepository, ICashierRepository, IAlertRepository } from '../../domain/interface/dashboard-superAdmin.repo';
import { AlertsResponseDto, CashiersPerformanceResponseDto, CategoriesPerformanceResponseDto, FinancialReportResponseDto, OverviewResponseDto, PeriodQueryDto, RankedQueryDto, ShopsPerformanceResponseDto, TopProductDto, SalesTimelineResponseDto, AlertsQueryDto } from '../super-Admin.dto.js';
import { Period, ShopFilter, ShopKpi, TopProduct, CategoryPerformance, CashierPerformance, DashboardAlert, AlertType, AlertSeverity } from '../../domain/entities/dashbord-superAdmin.js';

@Injectable()
export class GetDashboardOverviewUseCase {
  constructor(
    @Inject('ISalesRepository') private readonly salesRepo: ISalesRepository,
    @Inject('IShopRepository') private readonly shopRepo: IShopRepository,
    @Inject('IExpenseRepository') private readonly expenseRepo: IExpenseRepository,
    @Inject('ICustomerRepository') private readonly customerRepo: ICustomerRepository,
  ) {}

  async execute(query: PeriodQueryDto): Promise<OverviewResponseDto> {
    // 1. Construire les Value Objects du domaine
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const filter = ShopFilter.fromQuery(query.shopIds);

    // 2. Récupérer les données en parallèle (optimisation I/O)
    const [
      salesData,
      soldItems,
      expensesData,
      creditData,
      newCustomers,
      activeShops,
    ] = await Promise.all([
      this.salesRepo.getAggregatedSales(period, filter),
      this.salesRepo.getSoldItemsWithCost(period, filter),
      this.expenseRepo.getAggregatedExpenses(period, filter),
      this.customerRepo.getCreditOutstanding(),
      this.customerRepo.countNewCustomers(period),
      this.shopRepo.countActive(),
    ]);

    // 3. Calculs métier dans le domaine
    const revenue = salesData.current.totalAmount;
    const prevRevenue = salesData.previous.totalAmount;

    const cogs = soldItems.reduce(
      (acc, item) => acc + item.buyingPrice * item.quantity,
      0,
    );

    const grossMargin = revenue - cogs;
    const totalExpenses = expensesData.total;
    const prevExpenses = expensesData.previous;

    const evolutionRate = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    // 4. Assembler le DTO de réponse
    return {
      period: query.period ?? 'month',
      dateRange: {
        from: period.current.from,
        to: period.current.to,
      },
      kpis: {
        revenue: {
          value: revenue,
          previous: prevRevenue,
          evolution: evolutionRate(revenue, prevRevenue),
          currency: 'XOF',
        },
        transactions: {
          value: salesData.current.transactionCount,
          previous: salesData.previous.transactionCount,
          evolution: evolutionRate(
            salesData.current.transactionCount,
            salesData.previous.transactionCount,
          ),
        },
        grossMargin: {
          value: grossMargin,
          rate:
            revenue > 0
              ? parseFloat(((grossMargin / revenue) * 100).toFixed(2))
              : 0,
          currency: 'XOF',
        },
        expenses: {
          value: totalExpenses,
          previous: prevExpenses,
          evolution: evolutionRate(totalExpenses, prevExpenses),
        },
        netResult: {
          value: grossMargin - totalExpenses,
          isProfit: grossMargin >= totalExpenses,
        },
        creditOutstanding: {
          amount: creditData.totalDebt,
          customersCount: creditData.customersCount,
        },
        newCustomers,
        activeShops,
        averageBasket:
          salesData.current.transactionCount > 0
            ? parseFloat(
                (revenue / salesData.current.transactionCount).toFixed(0),
              )
            : 0,
        totalDiscounts: salesData.current.discountAmount,
      },
    };
  }
}

// ================================================================
// USE CASE 2 — GetShopsPerformanceUseCase
// ================================================================

@Injectable()
export class GetShopsPerformanceUseCase {
  constructor(
    @Inject('ISalesRepository') private readonly salesRepo: ISalesRepository,
    @Inject('IShopRepository') private readonly shopRepo: IShopRepository,
    @Inject('IExpenseRepository') private readonly expenseRepo: IExpenseRepository,
  ) {}

  async execute(query: RankedQueryDto): Promise<ShopsPerformanceResponseDto> {
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const limit = query.limit ?? 10;

    // Récupérer toutes les boutiques actives
    const shops = await this.shopRepo.findAllActive();

    // Métriques par boutique en parallèle
    const shopMetrics = await Promise.all(
      shops.map(async (shop) => {
        const shopFilter = ShopFilter.forShops([shop.id]);

        const [salesData, soldItems, expensesData, voidRate] =
          await Promise.all([
            this.salesRepo.getAggregatedSales(period, shopFilter),
            this.salesRepo.getSoldItemsWithCost(period, shopFilter),
            this.expenseRepo.getAggregatedExpenses(period, shopFilter),
            this.salesRepo.getTodayVoidRate(),
          ]);

        const revenue = salesData.current.totalAmount;
        const prevRevenue = salesData.previous.totalAmount;
        const cogs = soldItems.reduce(
          (a, i) => a + i.buyingPrice * i.quantity,
          0,
        );
        const expenses = expensesData.total;
        const grossMargin = revenue - cogs;

        const kpi = new ShopKpi(
          shop.id,
          shop.name,
          revenue,
          prevRevenue,
          salesData.current.transactionCount,
          expenses,
          cogs,
          salesData.current.discountAmount,
          voidRate.voided,
          shop.currency,
        );

        return {
          shopId: kpi.shopId,
          shopName: kpi.shopName,
          address: shop.address,
          currency: kpi.currency,
          revenue: kpi.revenue,
          previousRevenue: kpi.previousRevenue,
          evolution: kpi.revenueEvolution,
          transactions: kpi.transactions,
          averageBasket: kpi.averageBasket,
          totalDiscounts: kpi.totalDiscounts,
          expenses: kpi.expenses,
          netResult: kpi.netResult,
          voidRate: kpi.voidRate,
          rank: 0,
        };
      }),
    );

    // Tri par CA décroissant et attribution des rangs
    const sorted = shopMetrics
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    // Totaux consolidés
    const totals = sorted.reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.revenue,
        transactions: acc.transactions + s.transactions,
        expenses: acc.expenses + s.expenses,
        netResult: acc.netResult + s.netResult,
      }),
      { revenue: 0, transactions: 0, expenses: 0, netResult: 0 },
    );

    return {
      period: query.period ?? 'month',
      dateRange: { from: period.current.from, to: period.current.to },
      shops: sorted,
      totals,
      totalShops: shops.length,
    };
  }
}

// ================================================================
// USE CASE 3 — GetCategoriesPerformanceUseCase
// ================================================================

@Injectable()
export class GetCategoriesPerformanceUseCase {
  constructor(@Inject('ISalesRepository') private readonly salesRepo: ISalesRepository) {}

  async execute(
    query: PeriodQueryDto & { shopId?: string },
  ): Promise<CategoriesPerformanceResponseDto> {
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const filter = query.shopId
      ? ShopFilter.forShops([query.shopId])
      : ShopFilter.all();

    const soldItems = await this.salesRepo.getSoldItemsWithCost(period, filter);

    // Agrégation par catégorie
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        colorHex: string;
        revenue: number;
        cogs: number;
        quantity: number;
        transactions: number;
        productMap: Map<
          string,
          { name: string; revenue: number; quantity: number }
        >;
      }
    >();

    for (const item of soldItems) {
      const catId = item.categoryId ?? 'uncategorized';
      const catName = item.categoryName ?? 'Non catégorisé';
      const catColor = item.categoryColor ?? '#94A3B8';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          colorHex: catColor,
          revenue: 0,
          cogs: 0,
          quantity: 0,
          transactions: 0,
          productMap: new Map(),
        });
      }

      const cat = categoryMap.get(catId)!;
      cat.revenue += item.totalPrice;
      cat.cogs += item.buyingPrice * item.quantity;
      cat.quantity += item.quantity;
      cat.transactions += 1;

      const existing = cat.productMap.get(item.productId);
      if (existing) {
        existing.revenue += item.totalPrice;
        existing.quantity += item.quantity;
      } else {
        cat.productMap.set(item.productId, {
          name: item.productName,
          revenue: item.totalPrice,
          quantity: item.quantity,
        });
      }
    }

    const totalRevenue = [...categoryMap.values()].reduce(
      (a, c) => a + c.revenue,
      0,
    );

    // Construction des entités domaine + DTOs
    const categories = [...categoryMap.values()]
      .map((cat) => {
        const topProducts: TopProductDto[] = [...cat.productMap.entries()]
          .sort(([, a], [, b]) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(([id, p]) => new TopProduct(id, p.name, p.revenue, p.quantity));

        const entity = new CategoryPerformance(
          cat.categoryId,
          cat.categoryName,
          cat.colorHex,
          cat.revenue,
          cat.cogs,
          cat.quantity,
          cat.transactions,
          totalRevenue,
          topProducts,
        );

        return {
          categoryId: entity.categoryId,
          categoryName: entity.categoryName,
          colorHex: entity.colorHex,
          revenue: entity.revenue,
          cogs: entity.cogs,
          grossMargin: entity.grossMargin,
          grossMarginRate: entity.grossMarginRate,
          revenueShare: entity.revenueShare,
          quantity: entity.quantity,
          transactions: entity.transactions,
          topProducts: topProducts.map((p) => ({
            productId: p.productId,
            productName: p.productName,
            revenue: p.revenue,
            quantity: p.quantity,
          })),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      period: query.period ?? 'month',
      dateRange: { from: period.current.from, to: period.current.to },
      shopId: query.shopId ?? 'all',
      totalRevenue,
      categories,
    };
  }
}

// ================================================================
// USE CASE 4 — GetCashiersPerformanceUseCase
// ================================================================

@Injectable()
export class GetCashiersPerformanceUseCase {
  constructor(@Inject('ICashierRepository') private readonly cashierRepo: ICashierRepository) {}

  async execute(
    query: RankedQueryDto & { shopId?: string },
  ): Promise<CashiersPerformanceResponseDto> {
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const filter = query.shopId
      ? ShopFilter.forShops([query.shopId])
      : ShopFilter.all();

    const limit = query.limit ?? 20;

    // Données en parallèle
    const [salesByUser, sessionsByUser] = await Promise.all([
      this.cashierRepo.getSalesByUser(period, filter),
      this.cashierRepo.getSessionsByUser(period, filter),
    ]);

    // Enrichissement avec les infos utilisateurs
    const userIds = [...new Set(salesByUser.map((s) => s.userId))];
    const users = await this.cashierRepo.getUsersByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const sessionMap = new Map(sessionsByUser.map((s) => [s.userId, s]));

    // Calculs par caissier via entité domaine
    const cashiers = salesByUser
      .map((row) => {
        const user = userMap.get(row.userId);
        const session = sessionMap.get(row.userId);

        const entity = new CashierPerformance(
          row.userId,
          user?.name ?? 'Inconnu',
          user?.username ?? '',
          user?.role ?? 'CASHIER',
          row.shopId,
          user?.shopAccesses.find((a) => a.shopId === row.shopId)?.shopName ??
            '',
          row.totalAmount,
          0, // previous — à enrichir si besoin
          row.transactionCount,
          row.voidedCount,
          row.discountAmount,
          session?.totalMinutes ?? null,
          session?.sessionCount ?? 0,
          session?.totalDifference ?? 0,
        );

        return {
          userId: entity.userId,
          name: entity.name,
          username: entity.username,
          role: entity.role,
          shopId: entity.shopId,
          shopName: entity.shopName,
          revenue: entity.revenue,
          previousRevenue: entity.previousRevenue,
          evolution: entity.revenueEvolution,
          transactions: entity.transactions,
          averageBasket: entity.averageBasket,
          voidedSales: entity.voidedSales,
          voidRate: entity.voidRate,
          totalDiscounts: entity.totalDiscounts,
          discountRate: entity.discountRate,
          activeMinutes: entity.activeMinutes,
          sessionCount: entity.sessionCount,
          cashDifference: entity.cashDifference,
          revenuePerHour: entity.revenuePerHour,
          rank: 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    return {
      period: query.period ?? 'month',
      dateRange: { from: period.current.from, to: period.current.to },
      shopId: query.shopId ?? 'all',
      cashiers,
      summary: {
        totalCashiers: cashiers.length,
        totalRevenue: cashiers.reduce((a, c) => a + c.revenue, 0),
        totalTransactions: cashiers.reduce((a, c) => a + c.transactions, 0),
        totalVoids: cashiers.reduce((a, c) => a + c.voidedSales, 0),
      },
    };
  }
}

// ================================================================
// USE CASE 5 — GetSalesTimelineUseCase
// ================================================================

@Injectable()
export class GetSalesTimelineUseCase {
  constructor(@Inject('ISalesRepository') private readonly salesRepo: ISalesRepository) {}

  async execute(query: PeriodQueryDto): Promise<SalesTimelineResponseDto> {
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const filter = ShopFilter.fromQuery(query.shopIds);

    const rawPoints = await this.salesRepo.getSalesTimeline(period, filter);

    // Agrégation globale et par boutique
    const timelineMap = new Map<
      string,
      { revenue: number; transactions: number }
    >();
    const shopMap = new Map<
      string,
      { shopName: string; data: Map<string, { revenue: number; transactions: number }> }
    >();

    for (const point of rawPoints) {
      const key = period.formatTimeKey(point.createdAt);
      const amount = point.totalAmount;

      // Global
      if (!timelineMap.has(key))
        timelineMap.set(key, { revenue: 0, transactions: 0 });
      timelineMap.get(key)!.revenue += amount;
      timelineMap.get(key)!.transactions += 1;

      // Par boutique
      if (!shopMap.has(point.shopId)) {
        shopMap.set(point.shopId, {
          shopName: point.shopName,
          data: new Map(),
        });
      }
      const shopData = shopMap.get(point.shopId)!.data;
      if (!shopData.has(key)) {
        shopData.set(key, { revenue: 0, transactions: 0 });
      }
      const shopPoint = shopData.get(key)!;
      shopPoint.revenue += amount;
      shopPoint.transactions += 1;
    }

    const timeline = [...timelineMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeKey, data]) => ({
        timeKey,
        revenue: parseFloat(data.revenue.toFixed(2)),
        transactions: data.transactions,
      }));

    const totalRevenue = timeline.reduce((a, t) => a + t.revenue, 0);
    const bestPeriod = timeline.reduce<(typeof timeline)[0] | null>(
      (best, t) => (!best || t.revenue > best.revenue ? t : best),
      null,
    );
    const worstPeriod = timeline.reduce<(typeof timeline)[0] | null>(
      (worst, t) => (!worst || t.revenue < worst.revenue ? t : worst),
      null,
    );

    return {
      period: query.period ?? 'month',
      dateRange: { from: period.current.from, to: period.current.to },
      granularity: period.granularity,
      timeline,
      byShop: [...shopMap.entries()].map(([shopId, shopData]) => ({
        shopId,
        shopName: shopData.shopName,
        data: [...shopData.data.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timeKey, shopPoint]) => ({
            timeKey,
            revenue: parseFloat(shopPoint.revenue.toFixed(2)),
            transactions: shopPoint.transactions,
          })),
      })),
      stats: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averagePerPeriod:
          timeline.length > 0
            ? parseFloat((totalRevenue / timeline.length).toFixed(2))
            : 0,
        bestPeriod,
        worstPeriod,
        totalDataPoints: timeline.length,
      },
    };
  }
}

// ================================================================
// USE CASE 6 — GetDashboardAlertsUseCase
// ================================================================

@Injectable()
export class GetDashboardAlertsUseCase {
  constructor(
    @Inject('IAlertRepository') private readonly alertRepo: IAlertRepository,
    @Inject('ICustomerRepository') private readonly customerRepo: ICustomerRepository,
    @Inject('ISalesRepository') private readonly salesRepo: ISalesRepository,
  ) {}

  async execute(query: AlertsQueryDto): Promise<AlertsResponseDto> {
    const debtThreshold = query.debtThreshold ?? 50000;
    const cashThreshold = query.cashDiscrepancyThreshold ?? 5000;
    const lookbackDays = query.lookbackDays ?? 7;

    const [
      lowStockProducts,
      unclosedSessions,
      highDebtCustomers,
      todayVoidRate,
      abnormalSessions,
      syncStatus,
    ] = await Promise.all([
      this.alertRepo.getLowStockProducts(20),
      this.alertRepo.getUnclosedSessions(),
      this.customerRepo.getHighDebtCustomers(debtThreshold),
      this.salesRepo.getTodayVoidRate(),
      this.alertRepo.getAbnormalCashSessions(cashThreshold, lookbackDays),
      this.alertRepo.getPendingSyncCount(),
    ]);

    const alerts: DashboardAlert[] = [];

    // Alerte : stock bas
    if (lowStockProducts.length > 0) {
      alerts.push(
        new DashboardAlert(
          AlertType.LOW_STOCK,
          AlertSeverity.WARNING,
          `${lowStockProducts.length} produit(s) en stock bas ou rupture`,
          lowStockProducts.length,
          { items: lowStockProducts },
        ),
      );
    }

    // Alerte : sessions non fermées
    if (unclosedSessions.length > 0) {
      alerts.push(
        new DashboardAlert(
          AlertType.UNCLOSED_SESSIONS,
          AlertSeverity.CRITICAL,
          `${unclosedSessions.length} session(s) de caisse non fermée(s)`,
          unclosedSessions.length,
          { items: unclosedSessions },
        ),
      );
    }

    // Alerte : dettes clients élevées
    if (highDebtCustomers.length > 0) {
      const totalDebt = highDebtCustomers.reduce((a, c) => a + c.totalDebt, 0);
      alerts.push(
        new DashboardAlert(
          AlertType.HIGH_DEBT_CUSTOMERS,
          AlertSeverity.WARNING,
          `${highDebtCustomers.length} client(s) avec dette > ${debtThreshold.toLocaleString()} XOF`,
          highDebtCustomers.length,
          {
            totalDebt,
            items: highDebtCustomers.map((c) => ({
              ...c,
              isOverLimit: c.creditLimit != null && c.totalDebt > c.creditLimit,
            })),
          },
        ),
      );
    }

    // Alerte : taux d'annulation élevé (> 10%)
    const voidRate =
      todayVoidRate.total > 0
        ? (todayVoidRate.voided / todayVoidRate.total) * 100
        : 0;

    if (voidRate > 10) {
      alerts.push(
        new DashboardAlert(
          AlertType.HIGH_VOID_RATE,
          AlertSeverity.WARNING,
          `Taux d'annulation aujourd'hui : ${voidRate.toFixed(2)}% (${todayVoidRate.voided}/${todayVoidRate.total} ventes)`,
          todayVoidRate.voided,
          { voidRate: parseFloat(voidRate.toFixed(2)), ...todayVoidRate },
        ),
      );
    }

    // Alerte : écarts de caisse
    if (abnormalSessions.length > 0) {
      alerts.push(
        new DashboardAlert(
          AlertType.CASH_DISCREPANCY,
          AlertSeverity.CRITICAL,
          `${abnormalSessions.length} écart(s) de caisse > ${cashThreshold.toLocaleString()} XOF`,
          abnormalSessions.length,
          { items: abnormalSessions },
        ),
      );
    }

    // Alerte : sync en attente
    if (syncStatus.pending > 0 || syncStatus.errors > 0) {
      const severity =
        syncStatus.errors > 0 ? AlertSeverity.WARNING : AlertSeverity.INFO;
      alerts.push(
        new DashboardAlert(
          AlertType.SYNC_PENDING,
          severity,
          `${syncStatus.pending} élément(s) en attente de synchronisation${
            syncStatus.errors > 0 ? ` dont ${syncStatus.errors} en erreur` : ''
          }`,
          syncStatus.pending,
          syncStatus,
        ),
      );
    }

    // Tri : critiques d'abord
    const severityOrder = {
      [AlertSeverity.CRITICAL]: 0,
      [AlertSeverity.WARNING]: 1,
      [AlertSeverity.INFO]: 2,
    };
    alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    return {
      generatedAt: new Date(),
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL)
        .length,
      warningCount: alerts.filter((a) => a.severity === AlertSeverity.WARNING)
        .length,
      alerts: alerts.map((a) => ({
        type: a.type,
        severity: a.severity,
        message: a.message,
        count: a.count,
        details: a.metadata,
      })),
    };
  }
}

// ================================================================
// USE CASE 7 — GetFinancialReportUseCase
// ================================================================

@Injectable()
export class GetFinancialReportUseCase {
  constructor(
    @Inject('ISalesRepository') private readonly salesRepo: ISalesRepository,
    @Inject('IExpenseRepository') private readonly expenseRepo: IExpenseRepository,
  ) {}

  async execute(query: PeriodQueryDto): Promise<FinancialReportResponseDto> {
    const period =
      query.period === 'custom' && query.startDate && query.endDate
        ? Period.fromCustomRange(
            new Date(query.startDate),
            new Date(query.endDate),
          )
        : Period.fromType(query.period ?? 'month');

    const filter = ShopFilter.fromQuery(query.shopIds);

    const [salesData, soldItems, expensesData] = await Promise.all([
      this.salesRepo.getAggregatedSales(period, filter),
      this.salesRepo.getSoldItemsWithCost(period, filter),
      this.expenseRepo.getAggregatedExpenses(period, filter),
    ]);

    const revenue = salesData.current.totalAmount;
    const prevRevenue = salesData.previous.totalAmount;
    const discounts = salesData.current.discountAmount;
    const taxes = salesData.current.taxAmount;
    const cogs = soldItems.reduce((a, i) => a + i.buyingPrice * i.quantity, 0);
    const grossMargin = revenue - cogs;
    const totalExpenses = expensesData.total;
    const operatingResult = grossMargin - totalExpenses;
    const netResult = operatingResult - taxes;

    const rate = (v: number, base: number) =>
      base > 0 ? parseFloat(((v / base) * 100).toFixed(2)) : 0;

    const evolution = (current: number, prev: number) =>
      prev === 0
        ? current > 0
          ? 100
          : 0
        : parseFloat((((current - prev) / prev) * 100).toFixed(2));

    return {
      period: query.period ?? 'month',
      dateRange: { from: period.current.from, to: period.current.to },
      currency: 'XOF',
      pnl: {
        revenue: {
          gross: revenue + discounts,
          discounts,
          net: revenue,
          evolution: evolution(revenue, prevRevenue),
          transactions: salesData.current.transactionCount,
        },
        cogs: {
          value: cogs,
          rate: rate(cogs, revenue),
        },
        grossMargin: {
          value: grossMargin,
          rate: rate(grossMargin, revenue),
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesData.byCategory.map((e) => ({
            category: e.category,
            amount: e.amount,
            share: rate(e.amount, totalExpenses),
          })),
        },
        operatingResult: {
          value: operatingResult,
          isProfit: operatingResult >= 0,
        },
        taxes,
        netResult: {
          value: netResult,
          isProfit: netResult >= 0,
          margin: rate(netResult, revenue),
        },
      },
      previousPeriod: { revenue: prevRevenue },
    };
  }
}
