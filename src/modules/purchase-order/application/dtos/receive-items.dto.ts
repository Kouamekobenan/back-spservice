import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
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
