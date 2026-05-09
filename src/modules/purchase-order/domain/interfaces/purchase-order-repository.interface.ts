import { PurchaseOrder } from '../entities/purchase-order.entity.js';
import { PurchaseOrderStatus } from '@prisma/client';
import { CreatePurchaseOrderDto } from '../../application/dtos/create-purchase-order.dto.js';
import { PurchaseOrderQueryDto } from '../../application/dtos/purchase-order-query.dto.js';
import { ReceiveItemsDto } from '../../application/dtos/receive-items.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface IPurchaseOrderRepository {
  create(data: CreatePurchaseOrderDto, orderNumber: string): Promise<PurchaseOrder>;
  findById(id: string): Promise<PurchaseOrder | null>;
  findAll(query: PurchaseOrderQueryDto): Promise<PaginatedResponseRepository<PurchaseOrder>>;
  updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder>;
  receiveItems(id: string, data: ReceiveItemsDto, userId: string): Promise<PurchaseOrder>;
  generateOrderNumber(shopId: string): Promise<string>;
}
