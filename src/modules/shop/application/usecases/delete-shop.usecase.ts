import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';

@Injectable()
export class DeleteShopUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(shopId: string): Promise<boolean> {
    try {
      await this.shopRepository.deleteShop(shopId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la boutique');
      return false;
    }
  }
}
