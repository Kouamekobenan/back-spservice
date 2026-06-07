import { Module } from '@nestjs/common';
import { SaleController } from './presentation/controllers/sale.controller.js';
import { CreateSaleUseCase }   from './application/usecases/create-sale.usecase.js';
import { FindSaleByIdUseCase } from './application/usecases/find-sale-by-id.usecase.js';
import { FindAllSalesUseCase } from './application/usecases/find-all-sales.usecase.js';
import { VoidSaleUseCase }     from './application/usecases/void-sale.usecase.js';
import { RefundSaleUseCase }   from './application/usecases/refund-sale.usecase.js';
import { PrismaSaleRepository } from './infrastructure/repository/prisma-sale.repository.js';
import { SaleMapper } from './domain/mappers/sale.mapper.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [SaleController],
  providers: [
    PrismaService,
    SaleMapper,
    CreateSaleUseCase,
    FindSaleByIdUseCase,
    FindAllSalesUseCase,
    VoidSaleUseCase,
    RefundSaleUseCase,
    {
      provide: 'ISaleRepository',
      useClass: PrismaSaleRepository,
    },
  ],
  exports: [CreateSaleUseCase, FindSaleByIdUseCase, FindAllSalesUseCase, VoidSaleUseCase, RefundSaleUseCase],
})
export class SaleModule {}
