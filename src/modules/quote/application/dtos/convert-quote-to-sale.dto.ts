import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { SalePaymentDto } from '../../../sale/application/dtos/create-sale.dto.js';

export class ConvertQuoteToSaleDto {
  @ApiProperty({
    example: 'user-uuid',
    required: false,
    description: 'Caissier effectuant la conversion en vente (par défaut le créateur du devis)',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    example: 'session-uuid',
    required: false,
    description: 'ID de la session de caisse active',
  })
  @IsString()
  @IsOptional()
  cashSessionId?: string;

  @ApiProperty({
    type: [SalePaymentDto],
    description: 'Modes et montants de paiement encaissés pour valider la vente issue du devis',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments!: SalePaymentDto[];

  @ApiProperty({ required: false, description: 'Notes additionnelles sur la vente' })
  @IsString()
  @IsOptional()
  notes?: string;
}
