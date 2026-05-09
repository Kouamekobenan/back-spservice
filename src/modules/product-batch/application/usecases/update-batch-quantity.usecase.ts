import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IProductBatchRepository } from '../../domain/interfaces/product-batch-repository.interface.js';
import { UpdateProductBatchDto } from '../dtos/update-batch.dto.js';
import { ProductBatchResponseDto } from '../dtos/product-batch-response.dto.js';

@Injectable()
export class UpdateBatchQuantityUseCase {
  constructor(
    @Inject('IProductBatchRepository')
    private readonly repository: IProductBatchRepository,
  ) {}

  async execute(id: string, data: UpdateProductBatchDto): Promise<ProductBatchResponseDto> {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new NotFoundException(`Batch avec l'ID ${id} non trouvé.`);
    }
    const result = await this.repository.update(id, data);
    return ProductBatchResponseDto.fromDomain(result);
  }
}
