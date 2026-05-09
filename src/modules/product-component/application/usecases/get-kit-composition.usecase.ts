import { Inject, Injectable } from '@nestjs/common';
import type {IProductComponentRepository } from '../../domain/interfaces/product-component-repository.interface.js';
import { ProductComponentResponseDto } from '../dtos/product-component-response.dto.js';

@Injectable()
export class GetKitCompositionUseCase {
  constructor(
    @Inject('IProductComponentRepository')
    private readonly repository: IProductComponentRepository,
  ) {}

  async execute(kitId: string): Promise<ProductComponentResponseDto[]> {
    const components = await this.repository.findByKitId(kitId);
    return components.map(ProductComponentResponseDto.fromDomain);
  }
}
