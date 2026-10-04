import { Inject, Injectable } from '@nestjs/common';
import type { IProductRepository } from '../../domain/interfaces/product-repository.interface.js';

@Injectable()
export class GenerateBarcodeUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(shopId: string): Promise<{ barcode: string }> {
    const barcode = await this.productRepository.generateUniqueBarcode(shopId);
    return { barcode };
  }
}
