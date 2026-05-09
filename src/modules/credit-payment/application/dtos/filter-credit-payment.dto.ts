import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class FilterCreditPaymentDto {
  @ApiPropertyOptional({ description: 'Filtrer par ID client' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par méthode de paiement', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filtrer par référence' })
  @IsOptional()
  @IsString()
  reference?: string;
}
