import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { UpdateShopDto } from '../dtos/update-shop.dto.js';

@Injectable()
export class UpdateShopUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(shopId: string, data: UpdateShopDto): Promise<Shop> {
    try {
      return await this.shopRepository.updateShop(shopId, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la boutique');
      throw error;
    }
  }
}
