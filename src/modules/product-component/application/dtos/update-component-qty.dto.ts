import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateProductComponentQtyDto {
  @ApiProperty({ example: 2, description: 'Nouvelle quantité' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;
}
