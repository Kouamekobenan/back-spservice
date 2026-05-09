import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';

@Injectable()
export class ToggleShopActiveUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(shopId: string, isActive: boolean): Promise<Shop> {
    try {
      return await this.shopRepository.toggleActive(shopId, isActive);
    } catch (error) {
      console.error('Erreur lors du changement de statut de la boutique');
      throw error;
    }
  }
}
