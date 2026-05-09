import { Module } from '@nestjs/common';
import { ProductComponentController } from './presentation/controllers/product-component.controller.js';
import { ProductComponentRepository } from './infrastructure/repository/product-component.repository.js';
import { ProductComponentMapper } from './domain/mappers/product-component.mapper.js';
import { AddComponentToKitUseCase } from './application/usecases/add-component-to-kit.usecase.js';
import { RemoveComponentFromKitUseCase } from './application/usecases/remove-component-from-kit.usecase.js';
import { GetKitCompositionUseCase } from './application/usecases/get-kit-composition.usecase.js';
import { UpdateComponentQuantityUseCase } from './application/usecases/update-component-quantity.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [ProductComponentController],
  providers: [
    PrismaService,
    ProductComponentMapper,
    AddComponentToKitUseCase,
    RemoveComponentFromKitUseCase,
    GetKitCompositionUseCase,
    UpdateComponentQuantityUseCase,
    {
      provide: 'IProductComponentRepository',
      useClass: ProductComponentRepository,
    },
  ],
  exports: [
    {
      provide: 'IProductComponentRepository',
      useClass: ProductComponentRepository,
    },
  ],
})
export class ProductComponentModule {}
