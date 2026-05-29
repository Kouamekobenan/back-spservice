import { Category } from '../entities/category.entity.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { CreateCategoryDto } from '../../application/dtos/create-category.dto.js';
import { CategoryQueryDto } from '../../application/dtos/category-query.dto.js';
import { UpdateCategoryDto } from '../../application/dtos/update-category.dto.js';

export interface ICategoryRepository {
  create(data: CreateCategoryDto): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findAll(
    query: CategoryQueryDto,
  ): Promise<PaginatedResponseRepository<Category>>;
  update(id: string, data: UpdateCategoryDto): Promise<Category>;
  delete(id: string): Promise<void>;
  findSubcategories(parentId: string): Promise<Category[]>;
  findRoots(): Promise<Category[]>;
  findByShopId(
    shopId: string,
    query: CategoryQueryDto,
  ): Promise<PaginatedResponseRepository<Category>>;
}
