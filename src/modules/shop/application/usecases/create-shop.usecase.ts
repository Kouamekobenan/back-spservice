import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { CreateShopDto } from '../dtos/create-shop-dto.dto.js';

@Injectable()
export class CreateShopUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(data: CreateShopDto): Promise<Shop> {
    try {
      return await this.shopRepository.createShop(data);
    } catch (error) {
      console.error('Erreur lors de la création de la boutique');
      throw error;
    }
  }
}
