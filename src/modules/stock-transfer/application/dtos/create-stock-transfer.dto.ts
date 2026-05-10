import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsPositive, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class StockTransferItemDto {
  @ApiProperty({ example: 'prod-uuid-123', description: 'ID du produit à transférer' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 10, description: 'Quantité à transférer' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 1500, description: 'Coût unitaire au moment du transfert' })
  @IsNumber()
  @IsPositive()
  unitCost: number;
}

export class CreateStockTransferDto {
  @ApiProperty({ example: 'shop-uuid-origin', description: 'ID de la boutique source' })
  @IsUUID()
  @IsNotEmpty()
  fromShopId: string;

  @ApiProperty({ example: 'shop-uuid-dest', description: 'ID de la boutique destination' })
  @IsUUID()
  @IsNotEmpty()
  toShopId: string;

  @ApiProperty({ example: 'user-uuid-123', description: 'ID de l\'utilisateur effectuant le transfert' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ type: [StockTransferItemDto], description: 'Liste des produits à transférer' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items: StockTransferItemDto[];

  @ApiProperty({ example: 'Transfert de stock hebdomadaire', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
