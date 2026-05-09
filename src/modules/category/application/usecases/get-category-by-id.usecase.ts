import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return CategoryResponseDto.fromDomain(category);
  }
}
