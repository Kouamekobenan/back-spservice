import { Sale } from '../entities/sale.entity.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';
import { FilterSaleDto } from '../../application/dtos/filter-sale.dto.js';
import { RefundSaleDto } from '../../application/dtos/refund-sale.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface ISaleRepository {
  create(data: CreateSaleDto, receiptNumber: string): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(filters: FilterSaleDto): Promise<PaginatedResponseRepository<Sale>>;
  generateReceiptNumber(shopId: string): Promise<string>;
  voidSale(saleId: string, userId: string, reason: string): Promise<Sale>;
  refundSale(saleId: string, dto: RefundSaleDto, receiptNumber: string): Promise<Sale>;
}
