import { Module } from '@nestjs/common';
import { CategoryController } from './presentation/controllers/category.controller.js';
import { CategoryRepository } from './infrastructure/repository/category.repository.js';
import { CategoryMapper } from './domain/mappers/category.mapper.js';
import { CreateCategoryUseCase } from './application/usecases/create-category.usecase.js';
import { GetAllCategoriesUseCase } from './application/usecases/get-all-categories.usecase.js';
import { GetCategoryByIdUseCase } from './application/usecases/get-category-by-id.usecase.js';
import { UpdateCategoryUseCase } from './application/usecases/update-category.usecase.js';
import { DeleteCategoryUseCase } from './application/usecases/delete-category.usecase.js';
import { GetSubcategoriesUseCase } from './application/usecases/get-subcategories.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [CategoryController],
  providers: [
    PrismaService,
    CategoryMapper,
    CreateCategoryUseCase,
    GetAllCategoriesUseCase,
    GetCategoryByIdUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetSubcategoriesUseCase,
    {
      provide: 'ICategoryRepository',
      useClass: CategoryRepository,
    },
  ],
  exports: [
    {
      provide: 'ICategoryRepository',
      useClass: CategoryRepository,
    },
  ],
})
export class CategoryModule {}
