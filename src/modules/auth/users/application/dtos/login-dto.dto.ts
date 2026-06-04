import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional, ValidateIf } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: '+2250701020304',
    description: "Numéro de téléphone (format +225XXXXXXXXXX) — utiliser phone OU username",
  })
  @ValidateIf((o) => !o.username)
  @IsNotEmpty({ message: "Le téléphone ou le nom d'utilisateur est requis." })
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'jean.dupont',
    description: "Nom d'utilisateur — alternative au numéro de téléphone",
  })
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty({ message: "Le téléphone ou le nom d'utilisateur est requis." })
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'password123',
    description: "Mot de passe de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password!: string;
}
