import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { CreateProductDto } from '../dtos/create-product.dto.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(data: CreateProductDto): Promise<ProductResponseDto> {
    // Vérifier l'unicité du code-barres dans la boutique
    if (data.barcode) {
      const existingBarcode = await this.productRepository.findByBarcode(data.barcode, data.shopId);
      if (existingBarcode) {
        throw new ConflictException(`Un produit avec le code-barres ${data.barcode} existe déjà dans cette boutique.`);
      }
    }

    // Vérifier l'unicité du SKU dans la boutique
    if (data.sku) {
      const existingSku = await this.productRepository.findBySku(data.sku, data.shopId);
      if (existingSku) {
        throw new ConflictException(`Un produit avec le SKU ${data.sku} existe déjà dans cette boutique.`);
      }
    }

    const product = await this.productRepository.create(data);
    return ProductResponseDto.fromDomain(product);
  }
}
