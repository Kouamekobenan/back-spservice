import { Inject, Injectable } from '@nestjs/common';
import { type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class GetStockAlertsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(shopId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.getLowStockAlerts(shopId);
    return products.map(ProductResponseDto.fromDomain);
  }
}
