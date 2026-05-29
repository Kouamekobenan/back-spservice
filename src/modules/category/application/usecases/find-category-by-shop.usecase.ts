import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ICategoryRepository } from '../../domain/interfaces/category-repository.interface';
import { CategoryQueryDto } from '../dtos/category-query.dto';
import { Category } from '../../domain/entities/category.entity';
import { PaginatedResponseRepository } from 'src/common/types/response-respository';

@Injectable()
export class FindCategoryByShopUseCase {
  private readonly logger = new Logger(FindCategoryByShopUseCase.name);
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}
  async execute(
    shopId: string,
    query: CategoryQueryDto,
  ): Promise<PaginatedResponseRepository<Category>> {
    try {
      return await this.categoryRepository.findByShopId(shopId, query);
    } catch (error) {
      this.logger.error(
        `Failed to find categories for shop ${shopId}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
