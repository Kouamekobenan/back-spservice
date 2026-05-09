import { Inject, Injectable } from '@nestjs/common';
import { type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductQueryDto } from '../dtos/product-query.dto.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class GetAllProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: ProductQueryDto): Promise<PaginatedResponseRepository<ProductResponseDto>> {
    const paginatedProducts = await this.productRepository.findAll(query);
    return {
      ...paginatedProducts,
      data: paginatedProducts.data.map(ProductResponseDto.fromDomain),
    };
  }
}
