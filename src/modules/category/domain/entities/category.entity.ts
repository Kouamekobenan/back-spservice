export class Category {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string | null,
    private readonly colorHex: string | null,
    private readonly iconName: string | null,
    private readonly parentId: string | null,
    private readonly shopId: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | null {
    return this.description;
  }

  getColorHex(): string | null {
    return this.colorHex;
  }

  getIconName(): string | null {
    return this.iconName;
  }

  getParentId(): string | null {
    return this.parentId;
  }

  getShopId(): string | null {
    return this.shopId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
