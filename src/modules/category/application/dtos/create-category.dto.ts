import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Alimentation',
    description: 'Nom de la catégorie',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Le nom de la catégorie est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name!: string;

  @ApiProperty({
    example: 'Produits de consommation courante',
    description: 'Description de la catégorie',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(255, {
    message: 'La description ne peut pas dépasser 255 caractères',
  })
  description?: string;

  @ApiProperty({
    example: '#FF5733',
    description: "Couleur hexadécimale pour l'interface POS",
    required: false,
    maxLength: 7,
  })
  @IsOptional()
  @IsString({ message: 'La couleur doit être une chaîne de caractères' })
  @MaxLength(7, { message: 'La couleur ne peut pas dépasser 7 caractères' })
  colorHex?: string;

  @ApiProperty({
    example: 'shopping-cart',
    description: "Nom de l'icône",
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: "L'icône doit être une chaîne de caractères" })
  @MaxLength(50, { message: "L'icône ne peut pas dépasser 50 caractères" })
  iconName?: string;

  @ApiProperty({
    example: 'uuid-parent-category',
    description: 'ID de la catégorie parente',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "L'ID du parent doit être un UUID valide" })
  parentId?: string;

  @ApiProperty({
    example: 'uuid-shop',
    description: 'ID de la boutique à laquelle la catégorie appartient',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "L'ID de la boutique doit être un UUID valide" })
  shopId?: string;
}
