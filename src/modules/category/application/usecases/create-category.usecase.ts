import { Inject, Injectable } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CreateCategoryDto } from '../dtos/create-category.dto.js';
import { CategoryResponseDto } from '../dtos/category-response.dto.js';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(data: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.create(data);
    return CategoryResponseDto.fromDomain(category);
  }
}
