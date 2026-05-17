import { Module } from '@nestjs/common';
import { DashboardSuperAdminController } from './presentation/controllers/dashboard-superAdmin.controller.js';
import { 
  GetDashboardOverviewUseCase, 
  GetShopsPerformanceUseCase, 
  GetCategoriesPerformanceUseCase, 
  GetCashiersPerformanceUseCase, 
  GetSalesTimelineUseCase, 
  GetDashboardAlertsUseCase, 
  GetFinancialReportUseCase 
} from './application/usecases/dashboard-usecase.js';
import { 
  PrismaSalesRepository, 
  PrismaShopRepository, 
  PrismaCashierRepository, 
  PrismaExpenseRepository, 
  PrismaCustomerRepository, 
  PrismaAlertRepository 
} from './infrastructure/dashboard-superAdmin-repo.impl.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardSuperAdminController],
  providers: [
    GetDashboardOverviewUseCase,
    GetShopsPerformanceUseCase,
    GetCategoriesPerformanceUseCase,
    GetCashiersPerformanceUseCase,
    GetSalesTimelineUseCase,
    GetDashboardAlertsUseCase,
    GetFinancialReportUseCase,
    {
      provide: 'ISalesRepository',
      useClass: PrismaSalesRepository,
    },
    {
      provide: 'IShopRepository',
      useClass: PrismaShopRepository,
    },
    {
      provide: 'ICashierRepository',
      useClass: PrismaCashierRepository,
    },
    {
      provide: 'IExpenseRepository',
      useClass: PrismaExpenseRepository,
    },
    {
      provide: 'ICustomerRepository',
      useClass: PrismaCustomerRepository,
    },
    {
      provide: 'IAlertRepository',
      useClass: PrismaAlertRepository,
    },
  ],
})
export class SuperAdminModule {}
