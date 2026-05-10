import { StockTransfer, StockTransferStatus } from '../entities/stock-transfer.entity.js';
import { CreateStockTransferDto } from '../../application/dtos/create-stock-transfer.dto.js';

export interface IStockTransferRepository {
  create(data: CreateStockTransferDto, transferNumber: string): Promise<StockTransfer>;
  findById(id: string): Promise<StockTransfer | null>;
  findAll(filters: { fromShopId?: string; toShopId?: string; status?: StockTransferStatus }): Promise<StockTransfer[]>;
  updateStatus(id: string, status: StockTransferStatus, userId: string): Promise<StockTransfer>;
  generateTransferNumber(fromShopId: string): Promise<string>;
}
