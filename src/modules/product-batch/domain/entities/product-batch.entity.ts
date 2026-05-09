export class ProductBatch {
  constructor(
    private readonly id: string,
    private readonly productId: string,
    private readonly batchNumber: string,
    private readonly quantity: number,
    private readonly expiresAt: Date | null,
    private readonly buyingPrice: number,
    private readonly receivedAt: Date,
  ) {}

  getId(): string { return this.id; }
  getProductId(): string { return this.productId; }
  getBatchNumber(): string { return this.batchNumber; }
  getQuantity(): number { return this.quantity; }
  getExpiresAt(): Date | null { return this.expiresAt; }
  getBuyingPrice(): number { return this.buyingPrice; }
  getReceivedAt(): Date { return this.receivedAt; }

  // Business Logic
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  isExpiringSoon(days: number = 30): boolean {
    if (!this.expiresAt) return false;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + days);
    return alertDate > this.expiresAt && !this.isExpired();
  }
}
