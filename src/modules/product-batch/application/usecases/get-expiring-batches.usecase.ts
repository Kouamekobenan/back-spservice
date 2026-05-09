import { Inject, Injectable } from '@nestjs/common';
import type { IProductBatchRepository } from '../../domain/interfaces/product-batch-repository.interface.js';
import { ProductBatchResponseDto } from '../dtos/product-batch-response.dto.js';

@Injectable()
export class GetExpiringBatchesUseCase {
  constructor(
    @Inject('IProductBatchRepository')
    private readonly repository: IProductBatchRepository,
  ) {}

  async execute(shopId: string, days: number = 30): Promise<ProductBatchResponseDto[]> {
    const results = await this.repository.getExpiringSoon(shopId, days);
    return results.map(ProductBatchResponseDto.fromDomain);
  }
}
