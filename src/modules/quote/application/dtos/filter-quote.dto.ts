import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { QuoteStatusType } from '../../domain/entities/quote.entity.js';

export class FilterQuoteDto {
  @ApiProperty({ required: false, description: 'ID de la boutique' })
  @IsString()
  @IsOptional()
  shopId?: string;

  @ApiProperty({
    required: false,
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'],
  })
  @IsIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'])
  @IsOptional()
  status?: QuoteStatusType;

  @ApiProperty({ required: false, description: 'Filtrer par créateur (userId)' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, description: 'Filtrer par client (customerId)' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ required: false, description: 'Recherche par numéro de devis ou nom du client' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Date début ISO 8601' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'Date fin ISO 8601' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 30;
}
