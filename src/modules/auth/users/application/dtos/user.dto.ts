import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsDate,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../../domain/enums/role.enum';
import { Type } from 'class-transformer';

export class UserDto {
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant doit être un UUID v4 valide" })
  id?: string;

  @ApiProperty({
    example: 'johndoe',
    description: "Nom d'utilisateur unique",
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  @IsString({ message: "Le nom d'utilisateur doit être une chaîne de caractères" })
  @MinLength(3, { message: "Le nom d'utilisateur doit contenir au moins 3 caractères" })
  @MaxLength(50, { message: "Le nom d'utilisateur ne peut pas dépasser 50 caractères" })
  username!: string; // OBLIGATOIRE

  @ApiProperty({
    example: 'securepassword123',
    description: "Mot de passe de l'utilisateur (hashé)",
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  passwordHash!: string; // OBLIGATOIRE

  @ApiProperty({
    example: 'Jean Dupont',
    description: "Nom complet de l'utilisateur",
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string; // OPTIONNEL
   @ApiProperty({
    example: 'Numéro de telephone',
    description: "Nom complet de l'utilisateur",
    required: false,
    maxLength: 100,
  })
  phone?:string;

  @ApiProperty({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: "Rôle de l'utilisateur dans le système",
    default: UserRole.SUPER_ADMIN,
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  @IsEnum(UserRole, {
    message: `Le rôle doit être l'une des valeurs suivantes: ${Object.values(UserRole).join(', ')}`,
  })
  role!: UserRole; // OBLIGATOIRE

  @ApiProperty({
    example: '1234',
    description: 'Code PIN à 4 chiffres pour sécuriser le compte',
    pattern: '^[0-9]{4}$',
    minLength: 4,
    maxLength: 4,
  })
  @IsNotEmpty({ message: 'Le code PIN est obligatoire' })
  @IsString({ message: 'Le PIN doit être une chaîne de caractères' })
  @Matches(/^[0-9]{4}$/, {
    message: 'Le PIN doit être composé de 4 chiffres exactement',
  })
  pin!: string; // OBLIGATOIRE

  @ApiProperty({
    example: true,
    description: "Indique si le compte utilisateur est actif",
    default: true,
  })
  @IsNotEmpty({ message: 'Le statut actif est obligatoire' })
  @IsBoolean({ message: 'Le statut actif doit être un booléen' })
  isActive!: boolean; // OBLIGATOIRE

  @ApiProperty({
    example: '2026-05-09T14:30:00Z',
    description: 'Date et heure de la dernière connexion',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La date de dernière connexion doit être une date valide' })
  lastLoginAt?: Date; // OPTIONNEL

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: "Identifiant local unique de l'utilisateur (UUID)",
    format: 'uuid',
  })
  shopId:string;
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant local doit être un UUID v4 valide" })
  localId?: string;
}