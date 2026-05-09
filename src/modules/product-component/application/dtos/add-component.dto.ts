import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class AddProductComponentDto {
  @ApiProperty({ example: 'kit-uuid', description: 'ID du produit composé (le kit)' })
  @IsNotEmpty()
  @IsUUID()
  composedId: string;

  @ApiProperty({ example: 'component-uuid', description: 'ID du produit composant' })
  @IsNotEmpty()
  @IsUUID()
  componentId: string;

  @ApiProperty({ example: 1, description: 'Quantité du composant dans le kit' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;
}
