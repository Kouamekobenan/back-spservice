export class Product {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly barcode: string | null,
    private readonly sku: string | null,
    private readonly description: string | null,
    private readonly buyingPrice: number,
    private readonly sellingPrice: number,
    private readonly wholeSalePrice: number | null,
    private readonly stockQty: number,
    private readonly minStockQty: number,
    private readonly maxStockQty: number | null,
    private readonly hasBatchTracking: boolean,
    private readonly metadata: any | null,
    private readonly isActive: boolean,
    private readonly shopId: string,
    private readonly categoryId: string | null,
    private readonly unitId: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getBarcode(): string | null { return this.barcode; }
  getSku(): string | null { return this.sku; }
  getDescription(): string | null { return this.description; }
  getBuyingPrice(): number { return this.buyingPrice; }
  getSellingPrice(): number { return this.sellingPrice; }
  getWholeSalePrice(): number | null { return this.wholeSalePrice; }
  getStockQty(): number { return this.stockQty; }
  getMinStockQty(): number { return this.minStockQty; }
  getMaxStockQty(): number | null { return this.maxStockQty; }
  getHasBatchTracking(): boolean { return this.hasBatchTracking; }
  getMetadata(): any | null { return this.metadata; }
  getIsActive(): boolean { return this.isActive; }
  getShopId(): string { return this.shopId; }
  getCategoryId(): string | null { return this.categoryId; }
  getUnitId(): string | null { return this.unitId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Business Logic
  isLowStock(): boolean {
    return this.stockQty <= this.minStockQty;
  }

  getProfitMargin(): number {
    return this.sellingPrice - this.buyingPrice;
  }
}
