import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus } from '@prisma/client';

export class FilterSaleDto {
  @ApiPropertyOptional({ description: 'ID de la boutique (obligatoire pour la liste)' })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut', enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({ description: 'Filtrer par caissier (userId)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par client (customerId)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par session de caisse' })
  @IsOptional()
  @IsUUID()
  cashSessionId?: string;

  @ApiPropertyOptional({ description: 'Recherche sur le numéro de reçu', example: 'SP-20260603' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)', example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)', example: '2026-06-30T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Numéro de page (défaut: 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Résultats par page, max 100 (défaut: 30)', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
