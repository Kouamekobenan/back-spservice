import { Shop } from 'src/modules/shop/domain/entities/shop-entity.entity';
import { UserRole } from '../enums/role.enum';

export class UserShopAccess {
  constructor(
    public readonly shopId: string,
    public readonly roleInShop: UserRole | null = null,
    public readonly shop?: Shop,
  ) {}
}

export class User {
  constructor(
    private readonly id: string,
    private username: string,
    private passwordHash: string,
    private refreshToken: string | null,
    private name: string | null,
    private phone: string | null,
    private role: UserRole,
    private pin: string | null,
    private isActive: boolean,
    private lastLoginAt: Date | null,
    private localId: string | null,
    private createdAt: Date,
    private updatedAt: Date,
    private shopAccesses: UserShopAccess[],
  ) {}

  getId(): string { return this.id; }
  getUsername(): string { return this.username; }
  getRole(): UserRole { return this.role; }
  getPassword(): string { return this.passwordHash; }
  getName(): string | null { return this.name; }
  getPhone(): string | null { return this.phone; }
  getPin(): string | null { return this.pin; }
  getIsActive(): boolean { return this.isActive; }
  getRefreshToken(): string | null { return this.refreshToken; }
  getLocalId(): string | null { return this.localId; }
  getCreatedAt(): Date { return this.createdAt; }
  getShopAccesses(): UserShopAccess[] { return this.shopAccesses; }

  hasAccessTo(shopId: string): boolean {
    if (this.role === UserRole.SUPER_ADMIN) return true;
    return this.shopAccesses.some((access) => access.shopId === shopId);
  }
}
