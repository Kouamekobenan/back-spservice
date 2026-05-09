import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsPhoneNumber, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+2250701020304',
    description: "Le numéro de téléphone de l'utilisateur au format international (+225)",
  })
  // 'CI' force la validation pour le format de Côte d'Ivoire
  @IsPhoneNumber('CI', { message: "Le numéro de téléphone doit être un format valide de Côte d'Ivoire." })
  @IsNotEmpty({ message: "Le numéro de téléphone est requis." })
  // Optionnel : Force la présence du signe + et des chiffres pour éviter les erreurs de saisie
  @Matches(/^\+225[0-9]{10}$/, { 
    message: "Le numéro doit commencer par +225 suivi des 10 chiffres." 
  })
  phone!: string;

  @ApiProperty({
    example: 'password123',
    description: "Le mot de passe de l'utilisateur",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password!: string;
}