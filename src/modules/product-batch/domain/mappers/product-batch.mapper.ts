import { Injectable } from '@nestjs/common';
import { ProductBatch } from '../entities/product-batch.entity.js';
import { Prisma, ProductBatch as PrismaProductBatch } from '@prisma/client';

@Injectable()
export class ProductBatchMapper {
  toPersistence(data: any): Prisma.ProductBatchCreateInput {
    return {
      product: { connect: { id: data.productId } },
      batchNumber: data.batchNumber,
      quantity: new Prisma.Decimal(data.quantity),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      buyingPrice: new Prisma.Decimal(data.buyingPrice),
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
    };
  }

  toDomain(prismaData: PrismaProductBatch): ProductBatch {
    return new ProductBatch(
      prismaData.id,
      prismaData.productId,
      prismaData.batchNumber,
      Number(prismaData.quantity),
      prismaData.expiresAt,
      Number(prismaData.buyingPrice),
      prismaData.receivedAt,
    );
  }
}
