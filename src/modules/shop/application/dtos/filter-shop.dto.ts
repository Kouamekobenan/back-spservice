import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterShopDto {
  @ApiProperty({
    example: 'Ma Boutique',
    description: 'Filtrer par nom de boutique',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Abidjan',
    description: 'Filtrer par adresse',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '+225 07 12 34 56 78',
    description: 'Filtrer par numéro de téléphone',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'boutique@example.com',
    description: 'Filtrer par email',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;
}
