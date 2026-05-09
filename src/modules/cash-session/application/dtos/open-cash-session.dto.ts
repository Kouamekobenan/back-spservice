import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenCashSessionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la boutique',
  })
  @IsUUID()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: "ID de l'utilisateur qui ouvre la session",
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 5000,
    description: 'Fond de caisse initial',
  })
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiProperty({
    example: 'Début de journée standard',
    description: 'Notes optionnelles lors de l’ouverture',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
