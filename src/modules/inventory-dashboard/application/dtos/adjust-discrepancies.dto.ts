import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class DiscrepancyItemDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'ID du produit' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 45, description: 'Quantité physique réellement comptée (>= 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedQuantity!: number;

  @ApiPropertyOptional({
    example: 'Perte constatée lors du comptage physique',
    description: 'Motif ou observation pour cet article',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdjustDiscrepanciesDto {
  @ApiProperty({ example: 'shop-uuid-123', description: 'ID de la boutique' })
  @IsUUID()
  @IsNotEmpty()
  shopId!: string;

  @ApiPropertyOptional({
    example: 'user-uuid-123',
    description: 'ID de l\'utilisateur (déduit du token JWT si non renseigné)',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: 'Inventaire physique trimestriel T3',
    description: 'Notes ou libellé général de la campagne d\'inventaire',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    type: [DiscrepancyItemDto],
    description: 'Liste des produits et de leurs stocks physiques constatés',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscrepancyItemDto)
  items!: DiscrepancyItemDto[];
}

export class DiscrepancyDetailDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) sku!: string | null;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty() stockBefore!: number;
  @ApiProperty() stockAfter!: number;
  @ApiProperty() discrepancy!: number;
  @ApiProperty() discrepancyValue!: number;
  @ApiProperty({ enum: ['SURPLUS', 'DEFICIT', 'MATCH'] }) status!: 'SURPLUS' | 'DEFICIT' | 'MATCH';
  @ApiPropertyOptional() movementId?: string;
}

export class AdjustDiscrepanciesResponseDto {
  @ApiProperty() shopId!: string;
  @ApiProperty() shopName!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() adjustedCount!: number;
  @ApiProperty() unchangedCount!: number;
  @ApiProperty() totalDiscrepancyQuantity!: number;
  @ApiProperty() totalDiscrepancyValue!: number;
  @ApiProperty({ type: [DiscrepancyDetailDto] }) details!: DiscrepancyDetailDto[];
  @ApiProperty() executedAt!: Date;
}
