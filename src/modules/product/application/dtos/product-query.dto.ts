import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string; // Nom, SKU ou Barcode

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isLowStock?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 200;
}
