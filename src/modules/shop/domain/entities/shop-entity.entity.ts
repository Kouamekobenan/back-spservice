import { ShopType } from "../enums/shopType-enum.enum";

export class Shop {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly address: string | null,
    private readonly phone: string | null,
    private readonly email: string | null,
    private readonly taxId: string | null,
    private readonly logoUrl: string | null,
    private readonly currency: string | null,
    private readonly isActive: boolean,
    private readonly shopType: ShopType ,
    private readonly shopTypeLabel: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}
  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getAddress(): string | null {
    return this.address;
  }
  getPhone(): string | null {
    return this.phone;
  }
  getEmail(): string | null {
    return this.email;
  }
  getTaxId(): string | null {
    return this.taxId;
  }
  getLogoUrl(): string | null {
    return this.logoUrl;
  }
  getCurrency(): string | null {
    return this.currency;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getShopType(): ShopType {
    return this.shopType;
  }
  getShopTypeLabel(): string | null {
    return this.shopTypeLabel;
  }
  }