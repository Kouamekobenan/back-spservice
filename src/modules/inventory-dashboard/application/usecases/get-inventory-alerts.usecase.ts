import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryDashboardRepository } from '../../domain/interfaces/inventory-dashboard.repository.interface.js';
import { InventoryQueryDto, buildDateRange } from '../dtos/inventory-query.dto.js';
import { InventoryAlertsResponseDto } from '../dtos/inventory-response.dto.js';

@Injectable()
export class GetInventoryAlertsUseCase {
  constructor(
    @Inject('IInventoryDashboardRepository')
    private readonly repo: IInventoryDashboardRepository,
  ) {}

  async execute(
    shopId: string,
    query: InventoryQueryDto,
  ): Promise<InventoryAlertsResponseDto> {
    const { from } = buildDateRange(query.period, query.startDate, query.endDate);

    const [alerts, dormant] = await Promise.all([
      this.repo.getStockAlerts(shopId),
      this.repo.getDormantProducts(shopId, from, 20),
    ]);

    const outOfStock = alerts
      .filter((p) => p.stockQty === 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        categoryName: p.categoryName,
        stockQty: p.stockQty,
        minStockQty: p.minStockQty,
        buyingPrice: p.buyingPrice,
        stockValue: 0,
      }));

    const lowStock = alerts
      .filter((p) => p.stockQty > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        categoryName: p.categoryName,
        stockQty: p.stockQty,
        minStockQty: p.minStockQty,
        buyingPrice: p.buyingPrice,
        stockValue: Math.round(p.stockQty * p.buyingPrice),
      }));

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
      generatedAt: new Date(),
      summary: {
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        dormantCount: dormantProducts.length,
        totalAlerts: outOfStock.length + lowStock.length + dormantProducts.length,
      },
      outOfStock,
      lowStock,
      dormantProducts,
    };
  }
}
