import { Injectable } from '@nestjs/common';
import { Product } from '../entities/product.entity.js';
import { CreateProductDto } from '../../application/dtos/create-product.dto.js';
import { UpdateProductDto } from '../../application/dtos/update-product.dto.js';
import { Prisma, Product as ProductPrisma } from '@prisma/client';
/**
 * toDecimal — convertit un number en Prisma.Decimal
 * Compatible PostgreSQL (attend Decimal) et SQLite (retourne number).
 * En mode SQLite, Prisma accepte directement les number pour les champs Float.
 */
const toDecimal = (value: number | string): Prisma.Decimal =>
  new Prisma.Decimal(String(value));

const toDecimalOrNull = (value: number | string | null | undefined): Prisma.Decimal | null =>
  value != null ? new Prisma.Decimal(String(value)) : null;
@Injectable()
export class ProductMapper {
  toPersistence(data: CreateProductDto): Prisma.ProductCreateInput {
    const persistenceData: Prisma.ProductCreateInput = {
      name: data.name,
      barcode: data.barcode,
      sku: data.sku,
      description: data.description,
      buyingPrice: toDecimal(data.buyingPrice),
      sellingPrice: toDecimal(data.sellingPrice),
      wholeSalePrice: toDecimalOrNull(data.wholeSalePrice),
      stockQty: toDecimal(data.stockQty || 0),
      minStockQty: toDecimal(data.minStockQty || 5),
      maxStockQty: toDecimalOrNull(data.maxStockQty),
      hasBatchTracking: data.hasBatchTracking || false,
      metadata: data.metadata || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      shop: { connect: { id: data.shopId } },
    };

    if (data.categoryId) {
      persistenceData.category = { connect: { id: data.categoryId } };
    }

    if (data.unitId) {
      persistenceData.unit = { connect: { id: data.unitId } };
    }

    return persistenceData;
  }

  toDomain(prismaData: ProductPrisma): Product {
    return new Product(
      prismaData.id,
      prismaData.name,
      prismaData.barcode,
      prismaData.sku,
      prismaData.description,
      Number(prismaData.buyingPrice),
      Number(prismaData.sellingPrice),
      prismaData.wholeSalePrice ? Number(prismaData.wholeSalePrice) : null,
      Number(prismaData.stockQty),
      Number(prismaData.minStockQty),
      prismaData.maxStockQty ? Number(prismaData.maxStockQty) : null,
      prismaData.hasBatchTracking,
      prismaData.metadata,
      prismaData.isActive,
      prismaData.shopId,
      prismaData.categoryId,
      prismaData.unitId,
      prismaData.createdAt,
      prismaData.updatedAt,
    );
  }
  toUpdatePersistence(data: UpdateProductDto): Prisma.ProductUpdateInput {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.buyingPrice !== undefined) updateData.buyingPrice = toDecimal(data.buyingPrice);
    if (data.sellingPrice !== undefined) updateData.sellingPrice = toDecimal(data.sellingPrice);
    if (data.wholeSalePrice !== undefined) updateData.wholeSalePrice = toDecimalOrNull(data.wholeSalePrice);
    if (data.stockQty !== undefined) updateData.stockQty = toDecimal(data.stockQty);
    if (data.minStockQty !== undefined) updateData.minStockQty = toDecimal(data.minStockQty);
    if (data.maxStockQty !== undefined) updateData.maxStockQty = toDecimalOrNull(data.maxStockQty);
    if (data.hasBatchTracking !== undefined) updateData.hasBatchTracking = data.hasBatchTracking;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.categoryId !== undefined) {
      if (data.categoryId === null) updateData.category = { disconnect: true };
      else updateData.category = { connect: { id: data.categoryId } };
    }

    if (data.unitId !== undefined) {
      if (data.unitId === null) updateData.unit = { disconnect: true };
      else updateData.unit = { connect: { id: data.unitId } };
    }

    return updateData;
  }
}
