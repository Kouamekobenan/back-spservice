export type QuoteStatusType =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export class QuoteItem {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly productSku: string | null,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly discount: number,
    public readonly totalPrice: number,
  ) {}
}

export class Quote {
  constructor(
    private readonly id: string,
    private readonly quoteNumber: string,
    private readonly status: QuoteStatusType,
    private readonly customerId: string | null,
    private readonly customerName: string | null,
    private readonly customerPhone: string | null,
    private readonly customerEmail: string | null,
    private readonly customerAddress: string | null,
    private readonly subtotal: number,
    private readonly discountAmount: number,
    private readonly taxAmount: number,
    private readonly totalAmount: number,
    private readonly validUntil: Date | null,
    private readonly notes: string | null,
    private readonly shopId: string,
    private readonly userId: string,
    private readonly convertedSaleId: string | null,
    private readonly items: QuoteItem[],
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string { return this.id; }
  getQuoteNumber(): string { return this.quoteNumber; }
  getStatus(): QuoteStatusType { return this.status; }
  getCustomerId(): string | null { return this.customerId; }
  getCustomerName(): string | null { return this.customerName; }
  getCustomerPhone(): string | null { return this.customerPhone; }
  getCustomerEmail(): string | null { return this.customerEmail; }
  getCustomerAddress(): string | null { return this.customerAddress; }
  getSubtotal(): number { return this.subtotal; }
  getDiscountAmount(): number { return this.discountAmount; }
  getTaxAmount(): number { return this.taxAmount; }
  getTotalAmount(): number { return this.totalAmount; }
  getValidUntil(): Date | null { return this.validUntil; }
  getNotes(): string | null { return this.notes; }
  getShopId(): string { return this.shopId; }
  getUserId(): string { return this.userId; }
  getConvertedSaleId(): string | null { return this.convertedSaleId; }
  getItems(): QuoteItem[] { return this.items; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
