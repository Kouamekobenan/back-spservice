import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductResponseDto } from '../dtos/product-response.dto.js';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    return ProductResponseDto.fromDomain(product);
  }
}
