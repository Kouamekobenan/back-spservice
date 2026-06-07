import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export type ExportFormat = 'pdf' | 'xlsx';

export class ExportQueryDto {
  @ApiProperty({ example: 'shop-uuid', description: 'ID de la boutique' })
  @IsUUID()
  shopId!: string;

  @ApiProperty({ enum: ['pdf', 'xlsx'], example: 'pdf', description: 'Format du fichier généré' })
  @IsEnum(['pdf', 'xlsx'])
  format!: ExportFormat;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', description: 'Date de début (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z', description: 'Date de fin (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Filtrer par caissier (rapports ventes)' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class StockExportQueryDto {
  @ApiProperty({ example: 'shop-uuid' })
  @IsUUID()
  shopId!: string;

  @ApiProperty({ enum: ['pdf', 'xlsx'], example: 'xlsx' })
  @IsEnum(['pdf', 'xlsx'])
  format!: ExportFormat;

  @ApiPropertyOptional({ example: 'category-uuid', description: 'Filtrer par catégorie' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['all', 'low', 'out'], example: 'low', description: 'Filtrer par statut stock' })
  @IsString()
  @IsOptional()
  stockFilter?: 'all' | 'low' | 'out';
}
