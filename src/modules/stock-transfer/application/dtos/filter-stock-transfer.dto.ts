import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StockTransferStatus } from '../../domain/entities/stock-transfer.entity.js';

export class FilterStockTransferDto {
  @ApiProperty({ required: false, description: 'Filtrer par boutique source' })
  @IsString()
  @IsOptional()
  fromShopId?: string;

  @ApiProperty({ required: false, description: 'Filtrer par boutique destination' })
  @IsString()
  @IsOptional()
  toShopId?: string;

  @ApiProperty({ required: false, enum: StockTransferStatus, description: 'Filtrer par statut' })
  @IsEnum(StockTransferStatus)
  @IsOptional()
  status?: StockTransferStatus;
}
