import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sale } from '../../domain/entities/sale.entity.js';

export class SaleItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() productSku!: string | null;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() discount!: number;
  @ApiProperty() totalPrice!: number;
}

export class SalePaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() method!: string;
  @ApiProperty() amount!: number;
  @ApiPropertyOptional() reference!: string | null;
  @ApiProperty() createdAt!: string;
}

export class SaleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() receiptNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountAmount!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() paidAmount!: number;
  @ApiProperty() changeAmount!: number;
  @ApiPropertyOptional() notes!: string | null;
  @ApiProperty() shopId!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() customerId!: string | null;
  @ApiPropertyOptional() cashSessionId!: string | null;
  @ApiPropertyOptional() originalSaleId!: string | null;
  @ApiProperty({ type: [SaleItemResponseDto] }) items!: SaleItemResponseDto[];
  @ApiProperty({ type: [SalePaymentResponseDto] }) payments!: SalePaymentResponseDto[];
  @ApiProperty() createdAt!: string;
}

export class PaginatedSaleResponseDto {
  @ApiProperty({ type: [SaleResponseDto] }) data!: SaleResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() limit!: number;
}

export function toSaleResponseDto(sale: Sale): SaleResponseDto {
  return {
    id:             sale.getId(),
    receiptNumber:  sale.getReceiptNumber(),
    status:         sale.getStatus(),
    subtotal:       Number(sale.getSubtotal()),
    discountAmount: Number(sale.getDiscountAmount()),
    taxAmount:      Number(sale.getTaxAmount()),
    totalAmount:    Number(sale.getTotalAmount()),
    paidAmount:     Number(sale.getPaidAmount()),
    changeAmount:   Number(sale.getChangeAmount()),
    notes:          sale.getNotes(),
    shopId:         sale.getShopId(),
    userId:         sale.getUserId(),
    customerId:     sale.getCustomerId(),
    cashSessionId:  sale.getCashSessionId(),
    originalSaleId: sale.getOriginalSaleId(),
    items: sale.getItems().map((item) => ({
      id:          item.id,
      productId:   item.productId,
      productName: item.productName,
      productSku:  item.productSku,
      quantity:    Number(item.quantity),
      unitPrice:   Number(item.unitPrice),
      discount:    Number(item.discount),
      totalPrice:  Number(item.totalPrice),
    })),
    payments: sale.getPayments().map((p) => ({
      id:        p.id,
      method:    p.method,
      amount:    Number(p.amount),
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
    })),
    createdAt: sale.getCreatedAt().toISOString(),
  };
}
