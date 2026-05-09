import { SyncStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

export class CashSession {
  constructor(
    private readonly id: string,
    private readonly shopId: string,
    private readonly userId: string,
    private readonly openingBalance: Decimal,
    private readonly closingBalance: Decimal | null,
    private readonly expectedBalance: Decimal | null,
    private readonly difference: Decimal | null,
    private readonly openedAt: Date,
    private readonly closedAt: Date | null,
    private readonly notes: string | null,
    private readonly syncStatus: SyncStatus,
    private readonly localId: string | null,
  ) {}

  getId(): string {
    return this.id;
  }

  getShopId(): string {
    return this.shopId;
  }

  getUserId(): string {
    return this.userId;
  }

  getOpeningBalance(): Decimal {
    return this.openingBalance;
  }

  getClosingBalance(): Decimal | null {
    return this.closingBalance;
  }

  getExpectedBalance(): Decimal | null {
    return this.expectedBalance;
  }

  getDifference(): Decimal | null {
    return this.difference;
  }

  getOpenedAt(): Date {
    return this.openedAt;
  }

  getClosedAt(): Date | null {
    return this.closedAt;
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

  isActive(): boolean {
    return this.closedAt === null;
  }
}
