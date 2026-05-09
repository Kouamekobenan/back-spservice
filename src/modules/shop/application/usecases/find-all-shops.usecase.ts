import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';

@Injectable()
export class FindAllShopsUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(): Promise<Shop[]> {
    try {
      return await this.shopRepository.getAllShops();
    } catch (error) {
      console.error('Erreur lors de la récupération des boutiques');
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}
