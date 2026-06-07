import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class RefundItemDto {
  @ApiProperty({ example: 'sale-item-uuid', description: 'ID de l\'article de la vente originale' })
  @IsUUID()
  @IsNotEmpty()
  saleItemId: string;

  @ApiProperty({ example: 2, description: 'Quantité à rembourser (doit être ≤ quantité vendue)' })
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class RefundSaleDto {
  @ApiProperty({ example: 'user-uuid', description: 'ID de l\'utilisateur qui effectue le remboursement' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    type: [RefundItemDto],
    description: 'Articles à rembourser. Si vide ou absent → remboursement total de tous les articles.',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  @IsOptional()
  items?: RefundItemDto[];

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Mode de remboursement',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'REF-ORANGE-123', description: 'Référence de transaction Mobile Money' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({
    example: true,
    description: 'Remettre les articles en stock (false si produit défectueux)',
    default: true,
  })
  @IsBoolean()
  returnToStock: boolean;

  @ApiProperty({ example: 'Produit défectueux', description: 'Raison obligatoire du remboursement' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
