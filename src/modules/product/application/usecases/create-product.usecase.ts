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
    // Générer un code-barres unique s'il n'est pas fourni
    if (!data.barcode) {
      data.barcode = await this.productRepository.generateUniqueBarcode(data.shopId);
    }
    // Vérifier l'unicité du code-barres dans la boutique
    if (data.barcode) {
      const existingBarcode = await this.productRepository.findByBarcode(data.barcode, data.shopId);
      if (existingBarcode) {
        throw new ConflictException(`Un produit avec le code-barres ${data.barcode} existe déjà dans cette boutique.`);
      }
    }
     // Format: SK-TIMESTAMP-RANDOM
// Simple et efficace
    const sku = `SK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

// Résultat: SK-L8X9K2M-A7F3
    const product = await this.productRepository.create({...data, sku});
    return ProductResponseDto.fromDomain(product);
  }
}
