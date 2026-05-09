import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { UpdateCategoryDto } from '../dtos/update-category.dto.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, data: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const categoryExists = await this.categoryRepository.findById(id);
    if (!categoryExists) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    const category = await this.categoryRepository.update(id, data);
    return CategoryResponseDto.fromDomain(category);
  }
}
