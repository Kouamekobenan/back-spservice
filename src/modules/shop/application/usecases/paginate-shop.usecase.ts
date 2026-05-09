import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { FilterShopDto } from '../dtos/filter-shop.dto.js';

@Injectable()
export class PaginateShopUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
  ) {}

  async execute(
    page: number,
    limit: number,
    search?: FilterShopDto,
    isActive?: boolean,
  ) {
    try {
      return await this.shopRepository.paginate(page, limit, search, isActive);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la pagination des boutiques', {
        cause: error,
        description: error.message,
      });
    }
  }
}
