import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { CreateShopDto } from '../../application/dtos/create-shop-dto.dto.js';
import { UpdateShopDto } from '../../application/dtos/update-shop.dto.js';
import { FilterShopDto } from '../../application/dtos/filter-shop.dto.js';

export interface IShopRepository {
  createShop(data: CreateShopDto): Promise<Shop>;
  getShopById(id: string): Promise<Shop | null>;
  getAllShops(): Promise<Shop[]>;
  updateShop(id: string, data: UpdateShopDto): Promise<Shop>;
  deleteShop(id: string): Promise<void>;
  toggleActive(id: string, isActive: boolean): Promise<Shop>;
  paginate(
    page: number,
    limit: number,
    search?: FilterShopDto,
    isActive?: boolean,
  ): Promise<PaginatedResponseRepository<Shop>>;
}
