import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteItemDto {
  @ApiProperty({ example: 'prod-uuid', description: 'ID du produit en boutique' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 2, description: 'Quantité demandée sur le devis' })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({
    example: 1500,
    required: false,
    description:
      'Prix unitaire proposé (optionnel : si omis, prend automatiquement le prix de vente ou de gros du produit en boutique)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ example: 0, required: false, description: 'Remise unitaire sur cet article' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreateQuoteDto {
  @ApiProperty({ example: 'shop-uuid', description: 'ID de la boutique' })
  @IsUUID()
  @IsNotEmpty()
  shopId!: string;

  @ApiProperty({ example: 'user-uuid', description: 'ID de l’utilisateur qui établit le devis' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    example: 'customer-uuid',
    required: false,
    description: 'ID d’un client existant (optionnel si coordonnées libres fournies)',
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'Entreprise ABC / M. Diallo', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ example: '+221 77 000 00 00', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: 'client@exemple.com', required: false })
  @IsString()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ example: 'Dakar, Sénégal', required: false })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Si true, utilise par défaut le prix de gros (wholeSalePrice) du produit quand unitPrice est omis',
  })
  @IsBoolean()
  @IsOptional()
  useWholesalePrice?: boolean;

  @ApiProperty({ type: [QuoteItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items!: QuoteItemDto[];

  @ApiProperty({ example: 0, required: false, description: 'Remise globale sur le devis' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ example: 0, required: false, description: 'Montant de taxe / TVA' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({
    example: '2026-12-26T23:59:59.000Z',
    required: false,
    description: 'Date de fin de validité du devis (par défaut +15 jours si omis)',
  })
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiProperty({ example: 'Devis valable 15 jours. Livraison sous 48h.', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
