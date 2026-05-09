import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    example: 'Kilogramme',
    description: 'Nom complet de l\'unité de mesure',
    minLength: 2,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Le nom de l\'unité est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  name: string;

  @ApiProperty({
    example: 'kg',
    description: 'Abréviation de l\'unité',
    minLength: 1,
    maxLength: 10,
  })
  @IsNotEmpty({ message: 'L\'abréviation est obligatoire' })
  @IsString({ message: 'L\'abréviation doit être une chaîne de caractères' })
  @MinLength(1, { message: 'L\'abréviation doit contenir au moins 1 caractère' })
  @MaxLength(10, { message: 'L\'abréviation ne peut pas dépasser 10 caractères' })
  abbreviation: string;
}
