import { UserRole } from '../enums/role.enum';

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
    private isActive:boolean,
    private lastLoginAt: Date | null,
    private shopId:string, 
    private localId:string,
    private createdAt: Date,
    private updatedAt: Date,
  ) {}
  // setter
  getId(): string {
    return this.id;
  }
 
  getRole(): UserRole {
    return this.role;
  }
  getPassword(): string {
    return this.passwordHash;
  }
  getName(): string | null {
    return this.name;
  }
  getPhone(): string | null {
    return this.phone;
  }
  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}
