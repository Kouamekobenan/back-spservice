import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../domain/entities/product.entity.js';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  barcode: string | null;

  @ApiProperty()
  sku: string | null;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  buyingPrice: number;

  @ApiProperty()
  sellingPrice: number;

  @ApiProperty()
  wholeSalePrice: number | null;

  @ApiProperty()
  stockQty: number;

  @ApiProperty()
  minStockQty: number;

  @ApiProperty()
  maxStockQty: number | null;

  @ApiProperty()
  isLowStock: boolean;

  @ApiProperty()
  hasBatchTracking: boolean;

  @ApiProperty()
  metadata: any | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  shopId: string;

  @ApiProperty()
  categoryId: string | null;

  @ApiProperty()
  unitId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.getId();
    dto.name = product.getName();
    dto.barcode = product.getBarcode();
    dto.sku = product.getSku();
    dto.description = product.getDescription();
    dto.buyingPrice = product.getBuyingPrice();
    dto.sellingPrice = product.getSellingPrice();
    dto.wholeSalePrice = product.getWholeSalePrice();
    dto.stockQty = product.getStockQty();
    dto.minStockQty = product.getMinStockQty();
    dto.maxStockQty = product.getMaxStockQty();
    dto.isLowStock = product.isLowStock();
    dto.hasBatchTracking = product.getHasBatchTracking();
    dto.metadata = product.getMetadata();
    dto.isActive = product.getIsActive();
    dto.shopId = product.getShopId();
    dto.categoryId = product.getCategoryId();
    dto.unitId = product.getUnitId();
    dto.createdAt = product.getCreatedAt();
    dto.updatedAt = product.getUpdatedAt();
    return dto;
  }
}
