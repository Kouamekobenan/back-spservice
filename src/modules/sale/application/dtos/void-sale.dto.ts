import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VoidSaleDto {
  @ApiProperty({ example: 'user-uuid', description: 'ID du caissier qui annule' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'Erreur de saisie du prix', description: 'Raison obligatoire de l\'annulation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
