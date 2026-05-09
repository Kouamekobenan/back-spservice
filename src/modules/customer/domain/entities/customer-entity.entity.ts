import { SyncStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

export class Customer {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly phone: string | null,
    private readonly email: string | null,
    private readonly address: string | null,
    private readonly totalDebt: Decimal,
    private readonly creditLimit: Decimal | null,
    private readonly notes: string | null,
    private readonly syncStatus: SyncStatus,
    private readonly localId: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPhone(): string | null {
    return this.phone;
  }

  getEmail(): string | null {
    return this.email;
  }

  getAddress(): string | null {
    return this.address;
  }

  getTotalDebt(): Decimal {
    return this.totalDebt;
  }

  getCreditLimit(): Decimal | null {
    return this.creditLimit;
  }

  getNotes(): string | null {
    return this.notes;
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  getLocalId(): string | null {
    return this.localId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
