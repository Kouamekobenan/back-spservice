import { Injectable } from '@nestjs/common';
import { StockTransfer as PrismaStockTransfer, StockTransferItem as PrismaStockTransferItem } from '@prisma/client';
import { StockTransfer, StockTransferItem, StockTransferStatus } from '../entities/stock-transfer.entity.js';

@Injectable()
export class StockTransferMapper {
  toDomain(prismaStockTransfer: PrismaStockTransfer & { items?: PrismaStockTransferItem[] }): StockTransfer {
    return new StockTransfer(
      prismaStockTransfer.id,
      prismaStockTransfer.transferNumber,
      prismaStockTransfer.fromShopId,
      prismaStockTransfer.toShopId,
      prismaStockTransfer.status as StockTransferStatus,
      prismaStockTransfer.notes,
      (prismaStockTransfer.items || []).map((item) => this.toDomainItem(item)),
      prismaStockTransfer.syncStatus,
      prismaStockTransfer.localId,
      prismaStockTransfer.createdAt,
      prismaStockTransfer.updatedAt,
    );
  }

  private toDomainItem(prismaItem: PrismaStockTransferItem): StockTransferItem {
    return new StockTransferItem(
      prismaItem.id,
      prismaItem.transferId,
      prismaItem.productId,
      Number(prismaItem.quantity),
      Number(prismaItem.unitCost),
    );
  }
}
