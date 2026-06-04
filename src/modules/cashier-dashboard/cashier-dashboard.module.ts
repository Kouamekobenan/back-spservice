import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CashierDashboardRepository } from './infrastructure/cashier-dashboard.repository.js';
import { GetCashierOverviewUseCase } from './application/use-cases/get-cashier-overview.use-case.js';
import { CashierDashboardController } from './presentation/controllers/cashier-dashboard.controller.js';

@Module({
  controllers: [CashierDashboardController],
  providers: [
    PrismaService,
    GetCashierOverviewUseCase,
    {
      provide:  'ICashierDashboardRepository',
      useClass: CashierDashboardRepository,
    },
  ],
})
export class CashierDashboardModule {}
