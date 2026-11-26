import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuoteItemDto } from './create-quote.dto.js';
import type { QuoteStatusType } from '../../domain/entities/quote.entity.js';

export class UpdateQuoteDto {
  @ApiProperty({
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    required: false,
    description: 'Nouveau statut du devis',
  })
  @IsIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'])
  @IsOptional()
  status?: QuoteStatusType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  useWholesalePrice?: boolean;

  @ApiProperty({ type: [QuoteItemDto], required: false, description: 'Nouvelle liste des articles (remplace les lignes existantes si fournie)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  @IsOptional()
  items?: QuoteItemDto[];

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
