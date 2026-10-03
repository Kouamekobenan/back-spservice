import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export type LossReason =
  | 'EXPIRED'
  | 'DAMAGED'
  | 'THEFT'
  | 'BROKEN'
  | 'SPOILED'
  | 'OTHER';

export class WriteOffItemDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'ID du produit à mettre au rebut' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 5, description: 'Quantité à déclasser (> 0)' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({
    example: 'Date de péremption dépassée de 10 jours',
    description: 'Observation sur cet article',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockWriteOffDto {
  @ApiProperty({ example: 'shop-uuid-123', description: 'ID de la boutique' })
  @IsUUID()
  @IsNotEmpty()
  shopId!: string;

  @ApiPropertyOptional({
    example: 'user-uuid-123',
    description: 'ID de l\'utilisateur exécutant l\'opération',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    enum: ['EXPIRED', 'DAMAGED', 'THEFT', 'BROKEN', 'SPOILED', 'OTHER'],
    example: 'EXPIRED',
    description: 'Motif du déclassement / de la perte',
  })
  @IsEnum(['EXPIRED', 'DAMAGED', 'THEFT', 'BROKEN', 'SPOILED', 'OTHER'])
  lossReason!: LossReason;

  @ApiPropertyOptional({
    example: 'Mise au rebut hebdomadaire des denrées périmées',
    description: 'Notes générales sur le lot de mise au rebut',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    type: [WriteOffItemDto],
    description: 'Liste des produits et quantités déclassées',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WriteOffItemDto)
  items!: WriteOffItemDto[];
}

export class WrittenOffItemDetailDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty({ nullable: true }) sku!: string | null;
  @ApiProperty() quantityWrittenOff!: number;
  @ApiProperty() unitCost!: number;
  @ApiProperty() totalLossValue!: number;
  @ApiProperty() stockBefore!: number;
  @ApiProperty() stockAfter!: number;
  @ApiProperty() movementId!: string;
}

export class StockWriteOffResponseDto {
  @ApiProperty() shopId!: string;
  @ApiProperty() shopName!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() lossReason!: LossReason;
  @ApiProperty() totalProductsCount!: number;
  @ApiProperty() totalUnitsWrittenOff!: number;
  @ApiProperty() totalLossValue!: number;
  @ApiProperty({ type: [WrittenOffItemDetailDto] }) items!: WrittenOffItemDetailDto[];
  @ApiProperty() executedAt!: Date;
}
