import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryDashboardRepository } from '../../domain/interfaces/inventory-dashboard.repository.interface.js';
import { StockValuationResponseDto } from '../dtos/inventory-response.dto.js';

@Injectable()
export class GetStockValuationUseCase {
  constructor(
    @Inject('IInventoryDashboardRepository')
    private readonly repo: IInventoryDashboardRepository,
  ) {}

  async execute(shopId: string): Promise<StockValuationResponseDto> {
    const categories = await this.repo.getCategoryStockValuation(shopId);

    const totalInventoryValue = categories.reduce((a, c) => a + c.inventoryValue, 0);
    const totalPotentialRevenue = categories.reduce((a, c) => a + c.potentialRevenue, 0);
    const totalPotentialProfit = totalPotentialRevenue - totalInventoryValue;

    return {
      shopId,
      currency: 'XOF',
      totalInventoryValue: Math.round(totalInventoryValue),
      totalPotentialRevenue: Math.round(totalPotentialRevenue),
      totalPotentialProfit: Math.round(totalPotentialProfit),
      byCategory: categories.map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName ?? 'Non catégorisé',
        colorHex: c.colorHex ?? '#94A3B8',
        productCount: c.productCount,
        totalStockUnits: parseFloat(c.totalStockUnits.toFixed(2)),
        inventoryValue: Math.round(c.inventoryValue),
        potentialRevenue: Math.round(c.potentialRevenue),
        potentialProfit: Math.round(c.potentialRevenue - c.inventoryValue),
        shareOfTotalValue:
          totalInventoryValue > 0
            ? parseFloat(((c.inventoryValue / totalInventoryValue) * 100).toFixed(2))
            : 0,
      })),
    };
  }
}
