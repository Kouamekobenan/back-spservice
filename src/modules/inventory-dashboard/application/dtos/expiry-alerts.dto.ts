import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ExpiryAlertsQueryDto {
  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: "Nombre de jours seuil pour considérer un produit comme périmant bientôt",
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  thresholdDays?: number = 30;
}

export class ExpiredProductItemDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty({ nullable: true }) sku!: string | null;
  @ApiProperty({ nullable: true }) categoryName!: string | null;
  @ApiProperty() stockQty!: number;
  @ApiProperty() buyingPrice!: number;
  @ApiProperty() sellingPrice!: number;
  @ApiProperty() totalLossValue!: number;
  @ApiProperty() expiryDate!: Date;
  @ApiProperty({ description: "Nombre de jours depuis l'expiration" }) daysExpired!: number;
}

export class ExpiringSoonProductItemDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) barcode!: string | null;
  @ApiProperty({ nullable: true }) sku!: string | null;
  @ApiProperty({ nullable: true }) categoryName!: string | null;
  @ApiProperty() stockQty!: number;
  @ApiProperty() buyingPrice!: number;
  @ApiProperty() sellingPrice!: number;
  @ApiProperty() atRiskValue!: number;
  @ApiProperty() expiryDate!: Date;
  @ApiProperty({ description: "Nombre de jours restants avant péremption" }) daysRemaining!: number;
}

export class ExpiryAlertsResponseDto {
  @ApiProperty() shopId!: string;
  @ApiProperty() shopName!: string;
  @ApiProperty() currency!: string;
  @ApiProperty()
  summary!: {
    expiredCount: number;
    expiredTotalUnits: number;
    expiredTotalLoss: number;
    expiringSoonCount: number;
    expiringSoonTotalUnits: number;
    expiringSoonTotalValue: number;
  };
  @ApiProperty({ type: [ExpiredProductItemDto] }) expiredProducts!: ExpiredProductItemDto[];
  @ApiProperty({ type: [ExpiringSoonProductItemDto] }) expiringSoonProducts!: ExpiringSoonProductItemDto[];
  @ApiProperty() generatedAt!: Date;
}
