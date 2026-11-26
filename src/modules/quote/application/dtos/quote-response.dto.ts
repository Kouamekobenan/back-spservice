import { ApiProperty } from '@nestjs/swagger';
import { Quote, QuoteItem } from '../../domain/entities/quote.entity.js';

export class QuoteItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ nullable: true }) productSku!: string | null;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() discount!: number;
  @ApiProperty() totalPrice!: number;
}

export class QuoteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() quoteNumber!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ nullable: true }) customerId!: string | null;
  @ApiProperty({ nullable: true }) customerName!: string | null;
  @ApiProperty({ nullable: true }) customerPhone!: string | null;
  @ApiProperty({ nullable: true }) customerEmail!: string | null;
  @ApiProperty({ nullable: true }) customerAddress!: string | null;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountAmount!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() totalAmount!: number;
  @ApiProperty({ nullable: true }) validUntil!: string | null;
  @ApiProperty({ nullable: true }) notes!: string | null;
  @ApiProperty() shopId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty({ nullable: true }) convertedSaleId!: string | null;
  @ApiProperty({ type: [QuoteItemResponseDto] }) items!: QuoteItemResponseDto[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class PaginatedQuoteResponseDto {
  @ApiProperty({ type: [QuoteResponseDto] }) data!: QuoteResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export function toQuoteResponseDto(quote: Quote): QuoteResponseDto {
  return {
    id:              quote.getId(),
    quoteNumber:     quote.getQuoteNumber(),
    status:          quote.getStatus(),
    customerId:      quote.getCustomerId(),
    customerName:    quote.getCustomerName(),
    customerPhone:   quote.getCustomerPhone(),
    customerEmail:   quote.getCustomerEmail(),
    customerAddress: quote.getCustomerAddress(),
    subtotal:        quote.getSubtotal(),
    discountAmount:  quote.getDiscountAmount(),
    taxAmount:       quote.getTaxAmount(),
    totalAmount:     quote.getTotalAmount(),
    validUntil:      quote.getValidUntil()?.toISOString() ?? null,
    notes:           quote.getNotes(),
    shopId:          quote.getShopId(),
    userId:          quote.getUserId(),
    convertedSaleId: quote.getConvertedSaleId(),
    items:           quote.getItems().map((it: QuoteItem) => ({
      id:          it.id,
      productId:   it.productId,
      productName: it.productName,
      productSku:  it.productSku,
      quantity:    it.quantity,
      unitPrice:   it.unitPrice,
      discount:    it.discount,
      totalPrice:  it.totalPrice,
    })),
    createdAt:       quote.getCreatedAt().toISOString(),
    updatedAt:       quote.getUpdatedAt().toISOString(),
  };
}
