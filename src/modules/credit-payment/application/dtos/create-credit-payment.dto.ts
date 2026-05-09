import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, Min, IsUUID } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateCreditPaymentDto {
  @ApiProperty({ 
    description: 'ID du client qui effectue le paiement',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ 
    description: 'Montant du versement',
    example: 5000,
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ 
    description: 'Méthode de paiement',
    enum: PaymentMethod,
    example: PaymentMethod.CASH
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ 
    description: 'Référence de la transaction (ex: ID Mobile Money, Numéro de chèque)',
    example: 'OM_123456789'
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ 
    description: 'Notes ou observations sur le paiement',
    example: 'Acompte pour la facture de Mars'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'ID local pour synchronisation offline',
    example: 'loc_789'
  })
  @IsOptional()
  @IsString()
  localId?: string;
}
