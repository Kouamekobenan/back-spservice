import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Filtrer par adresse email',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: 'Jean Dupont',
    description: 'Filtrer par nom',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '+221770000000',
    description: 'Filtrer par numéro de téléphone',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
export interface FiltreUserDto {
  email: string;
  name: string;
  phone: string;
}
