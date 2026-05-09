import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashSessionDto {
  @ApiProperty({
    example: 15000,
    description: 'Montant réel compté en caisse à la fermeture',
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  closingBalance: number;

  @ApiProperty({
    example: 'Rapport de fin de journée, tout est en ordre',
    description: 'Notes optionnelles lors de la fermeture',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
