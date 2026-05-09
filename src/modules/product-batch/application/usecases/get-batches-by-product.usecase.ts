import { Inject, Injectable } from '@nestjs/common';
import type { IProductBatchRepository } from '../../domain/interfaces/product-batch-repository.interface.js';
import { ProductBatchResponseDto } from '../dtos/product-batch-response.dto.js';

@Injectable()
export class GetBatchesByProductUseCase {
  constructor(
    @Inject('IProductBatchRepository')
    private readonly repository: IProductBatchRepository,
  ) {}

  async execute(productId: string): Promise<ProductBatchResponseDto[]> {
    const results = await this.repository.findByProductId(productId);
    return results.map(ProductBatchResponseDto.fromDomain);
  }
}
