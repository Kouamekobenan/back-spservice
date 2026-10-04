import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export type ProductSortBy = 'quantity' | 'revenue' | 'profit' | 'name';
export type SortOrder = 'asc' | 'desc';

export class ProductsSummaryQueryDto {
  @ApiProperty({ example: 'shop-uuid-123', description: 'ID de la boutique' })
  @IsUUID()
  shopId!: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', description: 'Date de début (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z', description: 'Date de fin (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ example: 'category-uuid', description: 'Filtrer par catégorie' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Lait', description: 'Recherche textuelle sur le nom, code-barres ou SKU' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['quantity', 'revenue', 'profit', 'name'], default: 'revenue', description: 'Critère de tri' })
  @IsEnum(['quantity', 'revenue', 'profit', 'name'])
  @IsOptional()
  sortBy?: ProductSortBy = 'revenue';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Ordre de tri' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: SortOrder = 'desc';

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Numéro de page' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50, description: "Nombre d'éléments par page" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}

export class ProductsSummaryExportQueryDto {
  @ApiProperty({ example: 'shop-uuid-123', description: 'ID de la boutique' })
  @IsUUID()
  shopId!: string;

  @ApiProperty({ enum: ['pdf', 'xlsx'], example: 'xlsx', description: 'Format de fichier généré' })
  @IsEnum(['pdf', 'xlsx'])
  format!: 'pdf' | 'xlsx';

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z', description: 'Date de début (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z', description: 'Date de fin (ISO 8601)' })
  @IsISO8601()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ example: 'category-uuid', description: 'Filtrer par catégorie' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Lait', description: 'Recherche textuelle' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['quantity', 'revenue', 'profit', 'name'], default: 'revenue' })
  @IsEnum(['quantity', 'revenue', 'profit', 'name'])
  @IsOptional()
  sortBy?: ProductSortBy = 'revenue';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: SortOrder = 'desc';
}

export class ProductSummaryItemDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty({ nullable: true }) sku!: string | null;
  @ApiProperty({ nullable: true }) categoryName!: string | null;
  @ApiProperty() currentStock!: number;
  @ApiProperty() buyingPrice!: number;
  @ApiProperty() sellingPrice!: number;
  @ApiProperty() unitsSold!: number;
  @ApiProperty() revenue!: number;
  @ApiProperty() cogs!: number;
  @ApiProperty() grossProfit!: number;
  @ApiProperty() marginRate!: number;
  @ApiProperty() transactionCount!: number;
}

export class ProductsSummaryResponseDto {
  @ApiProperty()
  shop!: { id: string; name: string; currency: string };

  @ApiProperty()
  period!: { from: Date; to: Date };

  @ApiProperty()
  summary!: {
    totalProductsSold: number;
    totalUnitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalGrossProfit: number;
    averageMarginRate: number;
  };

  @ApiProperty({ type: [ProductSummaryItemDto] })
  items!: ProductSummaryItemDto[];

  @ApiProperty()
  pagination!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
