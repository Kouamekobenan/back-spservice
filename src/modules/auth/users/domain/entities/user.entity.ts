import { UserRole } from '../enums/role.enum';

export class UserShopAccess {
  constructor(
    public readonly shopId: string,
    public readonly roleInShop: UserRole | null = null,
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
    private shopAccesses: UserShopAccess[],
    private localId: string | null,
    private createdAt: Date,
    private updatedAt: Date,
  ) {}

  getId(): string { return this.id; }
  getRole(): UserRole { return this.role; }
  getPassword(): string { return this.passwordHash; }
  getName(): string | null { return this.name; }
  getPhone(): string | null { return this.phone; }
  getRefreshToken(): string | null { return this.refreshToken; }
  getShopAccesses(): UserShopAccess[] { return this.shopAccesses; }

  hasAccessTo(shopId: string): boolean {
    if (this.role === UserRole.SUPER_ADMIN) return true;
    return this.shopAccesses.some(access => access.shopId === shopId);
  }
}
