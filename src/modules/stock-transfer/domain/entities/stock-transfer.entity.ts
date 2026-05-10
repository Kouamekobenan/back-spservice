import { Decimal } from '@prisma/client/runtime/library';

export class StockTransferItem {
  constructor(
    public readonly id: string,
    public readonly transferId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly unitCost: number,
  ) {}
}

export enum StockTransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class StockTransfer {
  constructor(
    public readonly id: string,
    public readonly transferNumber: string,
    public readonly fromShopId: string,
    public readonly toShopId: string,
    public readonly status: StockTransferStatus,
    public readonly notes: string | null,
    public readonly items: StockTransferItem[],
    public readonly syncStatus: string,
    public readonly localId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
