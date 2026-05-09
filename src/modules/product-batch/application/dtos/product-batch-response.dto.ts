import { ApiProperty } from '@nestjs/swagger';
import { ProductBatch } from '../../domain/entities/product-batch.entity.js';

export class ProductBatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  batchNumber: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false })
  expiresAt: Date | null;

  @ApiProperty()
  buyingPrice: number;

  @ApiProperty()
  receivedAt: Date;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  isExpiringSoon: boolean;

  static fromDomain(entity: ProductBatch): ProductBatchResponseDto {
    const dto = new ProductBatchResponseDto();
    dto.id = entity.getId();
    dto.productId = entity.getProductId();
    dto.batchNumber = entity.getBatchNumber();
    dto.quantity = entity.getQuantity();
    dto.expiresAt = entity.getExpiresAt();
    dto.buyingPrice = entity.getBuyingPrice();
    dto.receivedAt = entity.getReceivedAt();
    dto.isExpired = entity.isExpired();
    dto.isExpiringSoon = entity.isExpiringSoon();
    return dto;
  }
}
