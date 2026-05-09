import { Injectable } from '@nestjs/common';
import { PurchaseOrder } from '../entities/purchase-order.entity.js';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity.js';
import { 
  Prisma, 
  PurchaseOrder as PurchaseOrderPrisma, 
  PurchaseOrderItem as PurchaseOrderItemPrisma 
} from '@prisma/client';

@Injectable()
export class PurchaseOrderMapper {
  toDomain(
    order: PurchaseOrderPrisma & { items?: PurchaseOrderItemPrisma[] }
  ): PurchaseOrder {
    const items = order.items?.map(item => new PurchaseOrderItem(
      item.id,
      item.purchaseOrderId,
      item.productId,
      Number(item.quantityOrdered),
      Number(item.quantityReceived),
      Number(item.unitCost),
      Number(item.totalCost),
    )) || [];

    return new PurchaseOrder(
      order.id,
      order.orderNumber,
      order.status,
      order.supplierId,
      order.shopId,
      Number(order.subtotal),
      Number(order.totalAmount),
      Number(order.amountPaid),
      order.expectedAt,
      order.receivedAt,
      order.notes,
      items,
      order.createdAt,
      order.updatedAt,
    );
  }
}
