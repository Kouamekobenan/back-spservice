import { SaleStatus, SyncStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

export class SaleItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly productSku: string | null,
    public readonly quantity: Decimal,
    public readonly unitPrice: Decimal,
    public readonly discount: Decimal,
    public readonly totalPrice: Decimal,
  ) {}
}

export class SalePayment {
  constructor(
    public readonly id: string,
    public readonly method: string,
    public readonly amount: Decimal,
    public readonly reference: string | null,
    public readonly createdAt: Date,
  ) {}
}

export class Sale {
  constructor(
    private readonly id: string,
    private readonly receiptNumber: string,
    private readonly status: SaleStatus,
    private readonly subtotal: Decimal,
    private readonly discountAmount: Decimal,
    private readonly taxAmount: Decimal,
    private readonly totalAmount: Decimal,
    private readonly paidAmount: Decimal,
    private readonly changeAmount: Decimal,
    private readonly notes: string | null,
    private readonly shopId: string,
    private readonly userId: string,
    private readonly customerId: string | null,
    private readonly cashSessionId: string | null,
    private readonly originalSaleId: string | null,
    private readonly items: SaleItem[],
    private readonly payments: SalePayment[],
    private readonly syncStatus: SyncStatus,
    private readonly localId: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string { return this.id; }
  getReceiptNumber(): string { return this.receiptNumber; }
  getStatus(): SaleStatus { return this.status; }
  getSubtotal(): Decimal { return this.subtotal; }
  getDiscountAmount(): Decimal { return this.discountAmount; }
  getTaxAmount(): Decimal { return this.taxAmount; }
  getTotalAmount(): Decimal { return this.totalAmount; }
  getPaidAmount(): Decimal { return this.paidAmount; }
  getChangeAmount(): Decimal { return this.changeAmount; }
  getNotes(): string | null { return this.notes; }
  getShopId(): string { return this.shopId; }
  getUserId(): string { return this.userId; }
  getCustomerId(): string | null { return this.customerId; }
  getCashSessionId(): string | null { return this.cashSessionId; }
  getItems(): SaleItem[] { return this.items; }
  getPayments(): SalePayment[] { return this.payments; }
  getCreatedAt(): Date { return this.createdAt; }
}
