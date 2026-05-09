import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'Global Trade Inc.',
    description: 'Nom du fournisseur',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Le nom du fournisseur est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiProperty({
    example: 'Jean Dupont',
    description: 'Personne de contact chez le fournisseur',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Le contact doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le contact ne peut pas dépasser 100 caractères' })
  contact?: string;

  @ApiProperty({
    example: '+225 0102030405',
    description: 'Téléphone du fournisseur',
    required: false,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @MaxLength(20, { message: 'Le téléphone ne peut pas dépasser 20 caractères' })
  phone?: string;

  @ApiProperty({
    example: 'contact@globaltrade.com',
    description: 'Email du fournisseur',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'email doit être une adresse valide' })
  email?: string;

  @ApiProperty({
    example: 'Abidjan, Zone 4',
    description: 'Adresse du fournisseur',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'L\'adresse ne peut pas dépasser 255 caractères' })
  address?: string;

  @ApiProperty({
    example: 'Fournisseur de produits frais',
    description: 'Notes sur le fournisseur',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  notes?: string;

  @ApiProperty({
    example: true,
    description: 'Statut du fournisseur',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  isActive?: boolean;
}
