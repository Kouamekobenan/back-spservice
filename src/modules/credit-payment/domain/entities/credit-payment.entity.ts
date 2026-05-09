import { SyncStatus, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

export class CreditPayment {
  constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly amount: Decimal,
    private readonly method: PaymentMethod,
    private readonly reference: string | null,
    private readonly notes: string | null,
    private readonly syncStatus: SyncStatus,
    private readonly localId: string | null,
    private readonly createdAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getAmount(): Decimal {
    return this.amount;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }

  getReference(): string | null {
    return this.reference;
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
}
