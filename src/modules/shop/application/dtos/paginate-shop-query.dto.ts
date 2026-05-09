import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString, IsBooleanString } from 'class-validator';

export class PaginateShopQueryDto {
  @ApiProperty({
    example: '1',
    description: 'Numéro de la page',
    required: false,
    default: '1',
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({
    example: '10',
    description: "Nombre d'éléments par page",
    required: false,
    default: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiProperty({
    example: 'Ma Boutique',
    description: 'Filtrer par nom',
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
    description: 'Filtrer par téléphone',
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

  @ApiProperty({
    example: 'true',
    description: 'Filtrer par statut actif',
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
