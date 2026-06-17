import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryDashboardRepository } from '../../domain/interfaces/inventory-dashboard.repository.interface.js';
import { InventoryQueryDto, buildDateRange } from '../dtos/inventory-query.dto.js';
import { InventoryOverviewResponseDto } from '../dtos/inventory-response.dto.js';

@Injectable()
export class GetInventoryOverviewUseCase {
  constructor(
    @Inject('IInventoryDashboardRepository')
    private readonly repo: IInventoryDashboardRepository,
  ) {}

  async execute(
    shopId: string,
    query: InventoryQueryDto,
  ): Promise<InventoryOverviewResponseDto> {
    const { from, to } = buildDateRange(query.period, query.startDate, query.endDate);

    const [snapshot, salesSummary] = await Promise.all([
      this.repo.getStockSnapshot(shopId),
      this.repo.getSalesSummary(shopId, from, to),
    ]);

    const potentialProfit = snapshot.potentialRevenue - snapshot.inventoryValue;
    const potentialProfitRate =
      snapshot.potentialRevenue > 0
        ? parseFloat(((potentialProfit / snapshot.potentialRevenue) * 100).toFixed(2))
        : 0;

    const grossProfit = salesSummary.revenue - salesSummary.cogs;
    const grossProfitRate =
      salesSummary.revenue > 0
        ? parseFloat(((grossProfit / salesSummary.revenue) * 100).toFixed(2))
        : 0;

    return {
      shopId,
      period: query.period ?? 'month',
      dateRange: { from, to },
      stock: {
        totalActiveProducts: snapshot.totalActiveProducts,
        totalStockUnits: parseFloat(snapshot.totalStockUnits.toFixed(2)),
        inventoryValue: Math.round(snapshot.inventoryValue),
        potentialRevenue: Math.round(snapshot.potentialRevenue),
        potentialProfit: Math.round(potentialProfit),
        potentialProfitRate,
      },
      sales: {
        revenue: Math.round(salesSummary.revenue),
        cogs: Math.round(salesSummary.cogs),
        grossProfit: Math.round(grossProfit),
        grossProfitRate,
        transactionCount: salesSummary.transactionCount,
        unitsSold: parseFloat(salesSummary.unitsSold.toFixed(2)),
      },
      alerts: {
        outOfStock: snapshot.outOfStockCount,
        lowStock: snapshot.lowStockCount,
      },
    };
  }
}
