import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class GetProductByBarcodeUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(barcode: string, shopId?: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findByBarcodeExact(barcode, shopId);
    if (!product) {
      throw new NotFoundException({ message: 'Produit non trouvé', barcode });
    }
    return ProductResponseDto.fromDomain(product);
  }
}
