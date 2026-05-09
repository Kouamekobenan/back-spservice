import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {type IProductRepository } from '../../domain/interfaces/product-repository.interface.js';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    await this.productRepository.delete(id);
  }
}
