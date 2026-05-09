import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsObject,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Bouteille de Gaz 12kg', description: 'Nom du produit' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '6181234567890', description: 'Code-barres', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'GAZ-12KG-001', description: 'SKU interne', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'Bouteille de gaz butane type B12', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000, description: 'Prix d\'achat' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  buyingPrice: number;

  @ApiProperty({ example: 6500, description: 'Prix de vente' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 6200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholeSalePrice?: number;

  @ApiProperty({ example: 50, default: 0 })
  @IsOptional()
  @IsNumber()
  stockQty?: number = 0;

  @ApiProperty({ example: 10, default: 5 })
  @IsOptional()
  @IsNumber()
  minStockQty?: number = 5;

  @ApiProperty({ example: 200, required: false })
  @IsOptional()
  @IsNumber()
  maxStockQty?: number;

  @ApiProperty({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  hasBatchTracking?: boolean = false;

  @ApiProperty({ example: { gasWeight: 12, type: 'Butane' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ example: 'shop-uuid' })
  @IsNotEmpty()
  @IsUUID()
  shopId: string;

  @ApiProperty({ example: 'category-uuid', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'unit-uuid', required: false })
  @IsOptional()
  @IsUUID()
  unitId?: string;
}
