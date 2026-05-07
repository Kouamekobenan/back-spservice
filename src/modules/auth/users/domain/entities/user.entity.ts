import { UserRole } from '../enums/role.enum';

export class User {
  constructor(
    private readonly id: string,
    private name: string,
    private email: string | null,
    private password: string,
    private phone: string | null,
    private role: UserRole,
    private refreshToken: string | null,
    // private deviceToken: string | null,
    private createdAt: Date,
    private updatedAt: Date,
    public totalScans?: number,
  ) {}
  // setter
  getId(): string {
    return this.id;
  }
  get TotalScans() {
    return this.totalScans || 0;
  }
  getEmail(): string | null {
    return this.email;
  }
  getRole(): UserRole {
    return this.role;
  }
  getPassword(): string {
    return this.password;
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
