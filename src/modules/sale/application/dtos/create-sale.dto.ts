import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @ApiProperty({ example: 'prod-uuid', description: 'ID du produit' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantité vendue' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 1500, description: 'Prix unitaire appliqué' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 0, description: 'Remise sur cet article' })
  @IsNumber()
  @IsOptional()
  discount?: number;
}

export class SalePaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 3000, description: 'Montant payé via cette méthode' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'REF-12345', description: 'Référence de transaction', required: false })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class CreateSaleDto {
  @ApiProperty({ example: 'shop-uuid' })
  @IsUUID()
  @IsNotEmpty()
  shopId: string;

  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'customer-uuid', required: false })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'session-uuid', required: false })
  @IsUUID()
  @IsOptional()
  cashSessionId?: string;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ type: [SalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments: SalePaymentDto[];

  @ApiProperty({ example: 0, description: 'Remise globale sur la vente' })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ example: 0, description: 'Montant de taxe' })
  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ example: 'Vente rapide', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
