export class PurchaseOrderItem {
  constructor(
    private readonly id: string,
    private readonly purchaseOrderId: string,
    private readonly productId: string,
    private readonly quantityOrdered: number,
    private readonly quantityReceived: number,
    private readonly unitCost: number,
    private readonly totalCost: number,
  ) {}

  getId(): string {
    return this.id;
  }

  getPurchaseOrderId(): string {
    return this.purchaseOrderId;
  }

  getProductId(): string {
    return this.productId;
  }

  getQuantityOrdered(): number {
    return this.quantityOrdered;
  }

  getQuantityReceived(): number {
    return this.quantityReceived;
  }

  getUnitCost(): number {
    return this.unitCost;
  }

  getTotalCost(): number {
    return this.totalCost;
  }
}
