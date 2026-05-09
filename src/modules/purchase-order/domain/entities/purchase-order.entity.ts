import { PurchaseOrderStatus } from '@prisma/client';
import { PurchaseOrderItem } from './purchase-order-item.entity.js';

export class PurchaseOrder {
  constructor(
    private readonly id: string,
    private readonly orderNumber: string,
    private readonly status: PurchaseOrderStatus,
    private readonly supplierId: string,
    private readonly shopId: string,
    private readonly subtotal: number,
    private readonly totalAmount: number,
    private readonly amountPaid: number,
    private readonly expectedAt: Date | null,
    private readonly receivedAt: Date | null,
    private readonly notes: string | null,
    private readonly items: PurchaseOrderItem[],
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getOrderNumber(): string {
    return this.orderNumber;
  }

  getStatus(): PurchaseOrderStatus {
    return this.status;
  }

  getSupplierId(): string {
    return this.supplierId;
  }

  getShopId(): string {
    return this.shopId;
  }

  getSubtotal(): number {
    return this.subtotal;
  }

  getTotalAmount(): number {
    return this.totalAmount;
  }

  getAmountPaid(): number {
    return this.amountPaid;
  }

  getExpectedAt(): Date | null {
    return this.expectedAt;
  }

  getReceivedAt(): Date | null {
    return this.receivedAt;
  }

  getNotes(): string | null {
    return this.notes;
  }

  getItems(): PurchaseOrderItem[] {
    return this.items;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
