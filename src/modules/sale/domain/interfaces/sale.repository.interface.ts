import { Sale } from '../entities/sale.entity.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';

export interface ISaleRepository {
  create(data: CreateSaleDto, receiptNumber: string): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(filters: any): Promise<Sale[]>;
  generateReceiptNumber(shopId: string): Promise<string>;
}
