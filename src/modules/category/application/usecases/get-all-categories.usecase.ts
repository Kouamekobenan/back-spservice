import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CategoryQueryDto } from '../dtos/category-query.dto.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class GetAllCategoriesUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(query: CategoryQueryDto): Promise<PaginatedResponseRepository<CategoryResponseDto>> {
    const paginatedCategories = await this.categoryRepository.findAll(query);
    return {
      ...paginatedCategories,
      data: paginatedCategories.data.map(CategoryResponseDto.fromDomain),
    };
  }
}
