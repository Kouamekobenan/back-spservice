export class ShopSetting {
  constructor(
    private readonly id: string,
    private readonly shopId: string | null,
    private key: string,
    private value: string,
    private group: string,
  ) {}

  getId(): string { return this.id; }
  getShopId(): string | null { return this.shopId; }
  getKey(): string { return this.key; }
  getValue(): string { return this.value; }
  getGroup(): string { return this.group; }

  updateValue(value: string): void {
    this.value = value;
  }
}
