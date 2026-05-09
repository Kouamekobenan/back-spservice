import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class GetSubcategoriesUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(parentId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findSubcategories(parentId);
    return categories.map(CategoryResponseDto.fromDomain);
  }
}
