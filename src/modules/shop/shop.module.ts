import { Module } from '@nestjs/common';
import { ShopController } from './presentation/controllers/shop.controller.js';
import { ShopRepository } from './infrastructure/repository/shop.repository.js';
import { ShopMapper } from './domain/mappers/shop.mapper.js';
import { CreateShopUseCase } from './application/usecases/create-shop.usecase.js';
import { FindAllShopsUseCase } from './application/usecases/find-all-shops.usecase.js';
import { FindShopByIdUseCase } from './application/usecases/find-shop-by-id.usecase.js';
import { UpdateShopUseCase } from './application/usecases/update-shop.usecase.js';
import { DeleteShopUseCase } from './application/usecases/delete-shop.usecase.js';
import { PaginateShopUseCase } from './application/usecases/paginate-shop.usecase.js';
import { ToggleShopActiveUseCase } from './application/usecases/toggle-shop-active.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  imports: [],

  controllers: [ShopController],
  providers: [
    // Service
    PrismaService,

    // Use cases
    CreateShopUseCase,
    FindAllShopsUseCase,
    FindShopByIdUseCase,
    UpdateShopUseCase,
    DeleteShopUseCase,
    PaginateShopUseCase,
    ToggleShopActiveUseCase,

    // Repository (injection par interface)
    {
      provide: 'IShopRepository',
      useClass: ShopRepository,
    },

    // Mapper
    ShopMapper,
  ],
  exports: [ShopModule],
})
export class ShopModule {}
