import { Inject, Injectable } from '@nestjs/common';
import {type IProductBatchRepository } from '../../domain/interfaces/product-batch-repository.interface.js';
import { CreateProductBatchDto } from '../dtos/create-batch.dto.js';
import { ProductBatchResponseDto } from '../dtos/product-batch-response.dto.js';

@Injectable()
export class CreateProductBatchUseCase {
  constructor(
    @Inject('IProductBatchRepository')
    private readonly repository: IProductBatchRepository,
  ) {}

  async execute(data: CreateProductBatchDto): Promise<ProductBatchResponseDto> {
    const result = await this.repository.create(data);
    return ProductBatchResponseDto.fromDomain(result);
  }
}
