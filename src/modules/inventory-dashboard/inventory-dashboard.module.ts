import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { InventoryDashboardController } from './presentation/controllers/inventory-dashboard.controller.js';
import { InventoryAdjustmentController } from './presentation/controllers/inventory-adjustment.controller.js';
import { GetInventoryOverviewUseCase } from './application/usecases/get-inventory-overview.usecase.js';
import { GetTopProductsUseCase } from './application/usecases/get-top-products.usecase.js';
import { GetStockValuationUseCase } from './application/usecases/get-stock-valuation.usecase.js';
import { GetInventoryAlertsUseCase } from './application/usecases/get-inventory-alerts.usecase.js';
import { AdjustDiscrepanciesUseCase } from './application/usecases/adjust-discrepancies.usecase.js';
import { GetExpiryAlertsUseCase } from './application/usecases/get-expiry-alerts.usecase.js';
import { StockWriteOffUseCase } from './application/usecases/stock-write-off.usecase.js';
import { InventoryDashboardRepository } from './infrastructure/repository/inventory-dashboard.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    InventoryDashboardController,
    InventoryAdjustmentController,
  ],
  providers: [
    GetInventoryOverviewUseCase,
    GetTopProductsUseCase,
    GetStockValuationUseCase,
    GetInventoryAlertsUseCase,
    AdjustDiscrepanciesUseCase,
    GetExpiryAlertsUseCase,
    StockWriteOffUseCase,
    {
      provide: 'IInventoryDashboardRepository',
      useClass: InventoryDashboardRepository,
    },
  ],
  exports: [
    AdjustDiscrepanciesUseCase,
    GetExpiryAlertsUseCase,
    StockWriteOffUseCase,
  ],
})
export class InventoryDashboardModule {}

