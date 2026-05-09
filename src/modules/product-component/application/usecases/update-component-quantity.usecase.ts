import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {IProductComponentRepository } from '../../domain/interfaces/product-component-repository.interface.js';
import { UpdateProductComponentQtyDto } from '../dtos/update-component-qty.dto.js';
import { ProductComponentResponseDto } from '../dtos/product-component-response.dto.js';

@Injectable()
export class UpdateComponentQuantityUseCase {
  constructor(
    @Inject('IProductComponentRepository')
    private readonly repository: IProductComponentRepository,
  ) {}

  async execute(id: string, data: UpdateProductComponentQtyDto): Promise<ProductComponentResponseDto> {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new NotFoundException(`Lien composant avec l'ID ${id} non trouvé.`);
    }

    const result = await this.repository.updateQuantity(id, data);
    return ProductComponentResponseDto.fromDomain(result);
  }
}
