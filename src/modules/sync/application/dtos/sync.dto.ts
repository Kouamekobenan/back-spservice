import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ── Query DTOs ────────────────────────────────────────────────────

export class SnapshotQueryDto {
  @ApiPropertyOptional({ description: 'ID de la boutique (obligatoire pour les entités boutique)' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Entités à inclure dans le snapshot',
    example: 'products,customers,categories,units,suppliers',
  })
  @IsOptional()
  @IsString()
  entities?: string;

  @ApiPropertyOptional({ description: 'Page (défaut: 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Taille de page max 200 (défaut: 100)', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 100;
}

export class PullQueryDto {
  @ApiProperty({
    description: 'Timestamp ISO 8601 — retourne les changements APRÈS cette date',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsDateString()
  since!: string;

  @ApiPropertyOptional({ description: 'Filtrer par boutique' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    description: "Filtrer par types d'entités (séparés par virgule)",
    example: 'Sale,Product,Customer',
  })
  @IsOptional()
  @IsString()
  entityTypes?: string;

  @ApiPropertyOptional({ description: 'Nombre max de changements retournés (défaut: 500)', default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 500;

  @ApiPropertyOptional({ description: 'Offset pour paginer les résultats', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

// ── Response DTOs ─────────────────────────────────────────────────

export class SnapshotResponseDto {
  @ApiProperty() serverTime!: string;
  @ApiProperty() shopId!: string | null;
  @ApiProperty() entities!: Record<string, { data: unknown[]; total: number; page: number; totalPages: number }>;
}

export class ChangeDto {
  @ApiProperty() id!: string;
  @ApiProperty() entityType!: string;
  @ApiProperty() entityId!: string;
  @ApiProperty() operation!: string;
  @ApiPropertyOptional() shopId!: string | null;
  @ApiProperty() payload!: unknown;
  @ApiProperty() changedAt!: string;
}

export class PullResponseDto {
  @ApiProperty() since!: string;
  @ApiProperty() serverTime!: string;
  @ApiProperty() total!: number;
  @ApiProperty() hasMore!: boolean;
  @ApiProperty() nextOffset!: number;
  @ApiProperty({ type: [ChangeDto] }) changes!: ChangeDto[];
}
