import { Module } from '@nestjs/common';
import { ProductController } from './presentation/controllers/product.controller.js';
import { ProductRepository } from './infrastructure/repository/product.repository.js';
import { ProductMapper } from './domain/mappers/product.mapper.js';
import { CreateProductUseCase } from './application/usecases/create-product.usecase.js';
import { GetAllProductsUseCase } from './application/usecases/get-all-products.usecase.js';
import { GetProductByIdUseCase } from './application/usecases/get-product-by-id.usecase.js';
import { UpdateProductUseCase } from './application/usecases/update-product.usecase.js';
import { DeleteProductUseCase } from './application/usecases/delete-product.usecase.js';
import { GetStockAlertsUseCase } from './application/usecases/get-stock-alerts.usecase.js';
import { GetProductByBarcodeUseCase } from './application/usecases/get-product-by-barcode.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    ProductMapper,
    CreateProductUseCase,
    GetAllProductsUseCase,
    GetProductByIdUseCase,
    GetProductByBarcodeUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    GetStockAlertsUseCase,
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
  ],
  exports: [
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
  ],
})
export class ProductModule {}
