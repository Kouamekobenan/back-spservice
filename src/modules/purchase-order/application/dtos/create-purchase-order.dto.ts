import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.001)
  quantityOrdered: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59Z',
    required: false,
    description: 'Date de péremption de l\'article commandé',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'uuid-supplier' })
  @IsOptional()
  @IsNotEmpty()
  supplierId?: string;

  @ApiProperty({ example: 'uuid-shop' })
  // @IsUUID('4')
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({ example: '2026-06-01T12:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiProperty({
    example: 'Commande urgente pour le stock de sécurité',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
