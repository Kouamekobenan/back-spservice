import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './presentation/controllers/purchase-order.controller.js';
import { PrismaPurchaseOrderRepository } from './infrastructure/repository/prisma-purchase-order.repository.js';
import { PurchaseOrderMapper } from './domain/mappers/purchase-order.mapper.js';
import { CreatePurchaseOrderUseCase } from './application/usecases/create-purchase-order.usecase.js';
import { GetAllPurchaseOrdersUseCase } from './application/usecases/get-all-purchase-orders.usecase.js';
import { GetPurchaseOrderByIdUseCase } from './application/usecases/get-purchase-order-by-id.usecase.js';
import { UpdatePurchaseOrderStatusUseCase } from './application/usecases/update-purchase-order-status.usecase.js';
import { ReceivePurchaseOrderUseCase } from './application/usecases/receive-purchase-order.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [PurchaseOrderController],
  providers: [
    PrismaService,
    PurchaseOrderMapper,
    CreatePurchaseOrderUseCase,
    GetAllPurchaseOrdersUseCase,
    GetPurchaseOrderByIdUseCase,
    UpdatePurchaseOrderStatusUseCase,
    ReceivePurchaseOrderUseCase,
    {
      provide: 'IPurchaseOrderRepository',
      useClass: PrismaPurchaseOrderRepository,
    },
  ],
  exports: [
    {
      provide: 'IPurchaseOrderRepository',
      useClass: PrismaPurchaseOrderRepository,
    },
  ],
})
export class PurchaseOrderModule {}
