import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryDashboardRepository } from '../../domain/interfaces/inventory-dashboard.repository.interface.js';
import { InventoryQueryDto, buildDateRange } from '../dtos/inventory-query.dto.js';
import { TopProductsResponseDto } from '../dtos/inventory-response.dto.js';

@Injectable()
export class GetTopProductsUseCase {
  constructor(
    @Inject('IInventoryDashboardRepository')
    private readonly repo: IInventoryDashboardRepository,
  ) {}

  async execute(
    shopId: string,
    query: InventoryQueryDto,
  ): Promise<TopProductsResponseDto> {
    const { from, to } = buildDateRange(query.period, query.startDate, query.endDate);
    const periodDays = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / 86_400_000),
    );
    const limit = query.limit ?? 10;

    const [topPerf, dormant] = await Promise.all([
      this.repo.getProductPerformance(shopId, from, to, limit),
      this.repo.getDormantProducts(shopId, from, 15),
    ]);

    const topSellers = topPerf.map((p, i) => {
      const grossProfit = p.revenue - p.cogs;
      const grossProfitRate =
        p.revenue > 0
          ? parseFloat(((grossProfit / p.revenue) * 100).toFixed(2))
          : 0;

      const avgDailySales = p.unitsSold / periodDays;
      const stockCoverDays =
        avgDailySales > 0 ? Math.round(p.stockQty / avgDailySales) : null;

      return {
        rank: i + 1,
        productId: p.productId,
        productName: p.productName,
        sku: p.sku,
        categoryName: p.categoryName,
        categoryColor: p.categoryColor,
        stockQty: parseFloat(p.stockQty.toFixed(2)),
        buyingPrice: p.buyingPrice,
        sellingPrice: p.sellingPrice,
        unitsSold: parseFloat(p.unitsSold.toFixed(2)),
        revenue: Math.round(p.revenue),
        cogs: Math.round(p.cogs),
        grossProfit: Math.round(grossProfit),
        grossProfitRate,
        transactionCount: p.transactionCount,
        stockCoverDays,
      };
    });

    const dormantProducts = dormant.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      stockQty: parseFloat(p.stockQty.toFixed(2)),
      stockValue: Math.round(p.stockValue),
      daysSinceLastSale: p.lastSaleDate
        ? Math.floor((Date.now() - p.lastSaleDate.getTime()) / 86_400_000)
        : null,
    }));

    return {
      shopId,
      period: query.period ?? 'month',
      dateRange: { from, to },
      periodDays,
      topSellers,
      dormantProducts,
    };
  }
}
