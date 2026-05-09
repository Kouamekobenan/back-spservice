import { Module } from '@nestjs/common';
import { ProductBatchController } from './presentation/controllers/product-batch.controller.js';
import { ProductBatchRepository } from './infrastructure/repository/product-batch.repository.js';
import { ProductBatchMapper } from './domain/mappers/product-batch.mapper.js';
import { CreateProductBatchUseCase } from './application/usecases/create-batch.usecase.js';
import { GetBatchesByProductUseCase } from './application/usecases/get-batches-by-product.usecase.js';
import { UpdateBatchQuantityUseCase } from './application/usecases/update-batch-quantity.usecase.js';
import { GetExpiringBatchesUseCase } from './application/usecases/get-expiring-batches.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [ProductBatchController],
  providers: [
    PrismaService,
    ProductBatchMapper,
    CreateProductBatchUseCase,
    GetBatchesByProductUseCase,
    UpdateBatchQuantityUseCase,
    GetExpiringBatchesUseCase,
    {
      provide: 'IProductBatchRepository',
      useClass: ProductBatchRepository,
    },
  ],
  exports: [
    {
      provide: 'IProductBatchRepository',
      useClass: ProductBatchRepository,
    },
  ],
})
export class ProductBatchModule {}
