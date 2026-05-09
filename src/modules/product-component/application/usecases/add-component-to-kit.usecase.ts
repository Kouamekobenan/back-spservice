import { Inject, Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import type {IProductComponentRepository } from '../../domain/interfaces/product-component-repository.interface.js';
import { AddProductComponentDto } from '../dtos/add-component.dto.js';
import { ProductComponentResponseDto } from '../dtos/product-component-response.dto.js';

@Injectable()
export class AddComponentToKitUseCase {
  constructor(
    @Inject('IProductComponentRepository')
    private readonly repository: IProductComponentRepository,
  ) {}

  async execute(data: AddProductComponentDto): Promise<ProductComponentResponseDto> {
    if (data.composedId === data.componentId) {
      throw new BadRequestException('Un produit ne peut pas être un composant de lui-même.');
    }

    const alreadyExists = await this.repository.exists(data.composedId, data.componentId);
    if (alreadyExists) {
      throw new ConflictException('Ce composant fait déjà partie de ce kit.');
    }

    const result = await this.repository.addComponent(data);
    return ProductComponentResponseDto.fromDomain(result);
  }
}
