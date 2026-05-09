import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShopDto {
  @ApiProperty({
    example: 'Ma Boutique',
    description: 'Nom de la boutique',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Le nom de la boutique est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiProperty({
    example: 'Rue 10, Cocody, Abidjan',
    description: 'Adresse physique de la boutique',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "L'adresse doit être une chaîne de caractères" })
  @MaxLength(255, { message: "L'adresse ne peut pas dépasser 255 caractères" })
  address?: string;

  @ApiProperty({
    example: '+225 07 12 34 56 78',
    description: 'Numéro de téléphone de la boutique',
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
    example: 'boutique@example.com',
    description: 'Adresse email de la boutique',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  email?: string;

  @ApiProperty({
    example: 'CI-ABJ-2026-001',
    description: 'Numéro contribuable / RCCM',
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
    example: 'https://example.com/logo.png',
    description: 'URL du logo de la boutique',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "L'URL du logo doit être une chaîne de caractères" })
  logoUrl?: string;

  @ApiProperty({
    example: 'XOF',
    description: 'Devise utilisée par la boutique',
    required: false,
    default: 'XOF',
    maxLength: 5,
  })
  @IsOptional()
  @IsString({ message: 'La devise doit être une chaîne de caractères' })
  @MaxLength(5, { message: 'La devise ne peut pas dépasser 5 caractères' })
  currency?: string;
}