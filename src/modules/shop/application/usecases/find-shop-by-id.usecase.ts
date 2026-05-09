import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';

@Injectable()
export class FindShopByIdUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(shopId: string): Promise<Shop | null> {
    if (!shopId || typeof shopId !== 'string') {
      throw new BadRequestException('ID de la boutique invalide');
    }
    try {
      return await this.shopRepository.getShopById(shopId);
    } catch (error) {
      if (error.status === 404) throw error;

      throw new BadRequestException(
        `Erreur lors de la récupération de la boutique : ${error.message}`,
      );
    }
  }
}
