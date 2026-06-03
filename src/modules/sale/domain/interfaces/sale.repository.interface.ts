import { Sale } from '../entities/sale.entity.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';
import { FilterSaleDto } from '../../application/dtos/filter-sale.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface ISaleRepository {
  create(data: CreateSaleDto, receiptNumber: string): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(filters: FilterSaleDto): Promise<PaginatedResponseRepository<Sale>>;
  generateReceiptNumber(shopId: string): Promise<string>;
}
