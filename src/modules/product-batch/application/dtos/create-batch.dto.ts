import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateProductBatchDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 'LOT-2026-001' })
  @IsNotEmpty()
  @IsString()
  batchNumber: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ example: 4500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  buyingPrice: number;

  @ApiProperty({ example: '2026-05-09', required: false })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
