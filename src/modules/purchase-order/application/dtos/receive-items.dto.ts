import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDetailDto {
  @ApiProperty({ example: 'uuid-product' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59Z',
    required: false,
    description: 'Date de péremption constatée à la réception',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class ReceiveItemsDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ type: [ReceiveItemDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDetailDto)
  items: ReceiveItemDetailDto[];
}
