import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ShopType } from '../../domain/enums/shopType-enum.enum';

export class UpdateShopDto {
  @ApiProperty({
    example: 'Ma Boutique Renommée',
    description: 'Nouveau nom de la boutique',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name?: string;

  @ApiProperty({
    example: 'Rue 15, Plateau, Abidjan',
    description: 'Nouvelle adresse de la boutique',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
  address?: string;

  @ApiProperty({
    example: '+225 01 23 45 67 89',
    description: 'Nouveau numéro de téléphone',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, {
    message: 'Le téléphone ne peut pas dépasser 20 caractères',
  })
  phone?: string;

  @ApiProperty({
    example: 'contact@maboutique.com',
    description: 'Nouvelle adresse email',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  email?: string;

  @ApiProperty({
    example: 'CI-ABJ-2026-002',
    description: 'Nouveau numéro contribuable / RCCM',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'Le numéro fiscal doit être une chaîne de caractères',
  })
  @MaxLength(50, {
    message: 'Le numéro fiscal ne peut pas dépasser 50 caractères',
  })
  taxId?: string;

  @ApiProperty({
    example: 'https://example.com/new-logo.png',
    description: 'Nouvelle URL du logo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'URL du logo doit être une chaîne de caractères" })
  logoUrl?: string;

  @ApiProperty({
    example: 'XOF',
    description: 'Nouvelle devise',
    required: false,
    maxLength: 5,
  })
  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  @MaxLength(5, { message: 'La devise ne peut pas dépasser 5 caractères' })
  currency?: string;

  @ApiProperty({
    example: true,
    description: 'Statut actif de la boutique',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  isActive?: boolean;
  @ApiProperty({
    example: ShopType.SUPERMARKET,
    description: 'Type de la boutique',
    required: false,
  })
  @IsOptional()
  shopType?: ShopType;
  @ApiProperty({
    example: 'Supermarché',
    description: 'Libellé du type de la boutique',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le libellé du type de boutique doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le libellé du type de boutique ne peut pas dépasser 50 caractères' })
  shopTypeLabel?: string;
}
