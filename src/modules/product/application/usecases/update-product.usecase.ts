import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, data: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    const shopId = existingProduct.getShopId();

    // Vérifier l'unicité du code-barres si modifié
    if (data.barcode && data.barcode !== existingProduct.getBarcode()) {
      const existingBarcode = await this.productRepository.findByBarcode(data.barcode, shopId);
      if (existingBarcode) {
        throw new ConflictException({ message: 'Ce code-barres est déjà utilisé', field: 'barcode' });
      }
    }

    // Vérifier l'unicité du SKU si modifié
    if (data.sku && data.sku !== existingProduct.getSku()) {
      const existingSku = await this.productRepository.findBySku(data.sku, shopId);
      if (existingSku) {
        throw new ConflictException(`Un produit avec le SKU ${data.sku} existe déjà dans cette boutique.`);
      }
    }

    const updatedProduct = await this.productRepository.update(id, data);
    return ProductResponseDto.fromDomain(updatedProduct);
  }
}
