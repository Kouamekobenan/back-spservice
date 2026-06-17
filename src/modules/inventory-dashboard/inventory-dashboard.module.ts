import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { InventoryDashboardController } from './presentation/controllers/inventory-dashboard.controller.js';
import { GetInventoryOverviewUseCase } from './application/usecases/get-inventory-overview.usecase.js';
import { GetTopProductsUseCase } from './application/usecases/get-top-products.usecase.js';
import { GetStockValuationUseCase } from './application/usecases/get-stock-valuation.usecase.js';
import { GetInventoryAlertsUseCase } from './application/usecases/get-inventory-alerts.usecase.js';
import { InventoryDashboardRepository } from './infrastructure/repository/inventory-dashboard.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryDashboardController],
  providers: [
    GetInventoryOverviewUseCase,
    GetTopProductsUseCase,
    GetStockValuationUseCase,
    GetInventoryAlertsUseCase,
    {
      provide: 'IInventoryDashboardRepository',
      useClass: InventoryDashboardRepository,
    },
  ],
})
export class InventoryDashboardModule {}
