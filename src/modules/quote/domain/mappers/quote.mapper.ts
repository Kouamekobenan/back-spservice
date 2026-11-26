import { Quote, QuoteItem, QuoteStatusType } from '../entities/quote.entity.js';

export class QuoteMapper {
  toDomain(raw: any): Quote {
    const items: QuoteItem[] = (raw.items || []).map(
      (item: any) =>
        new QuoteItem(
          item.id,
          item.productId,
          item.productName,
          item.productSku ?? null,
          Number(item.quantity),
          Number(item.unitPrice),
          Number(item.discount ?? 0),
          Number(item.totalPrice),
        ),
    );

    return new Quote(
      raw.id,
      raw.quoteNumber,
      raw.status as QuoteStatusType,
      raw.customerId ?? null,
      raw.customerName ?? raw.customer?.name ?? null,
      raw.customerPhone ?? raw.customer?.phone ?? null,
      raw.customerEmail ?? raw.customer?.email ?? null,
      raw.customerAddress ?? raw.customer?.address ?? null,
      Number(raw.subtotal),
      Number(raw.discountAmount ?? 0),
      Number(raw.taxAmount ?? 0),
      Number(raw.totalAmount),
      raw.validUntil ? new Date(raw.validUntil) : null,
      raw.notes ?? null,
      raw.shopId,
      raw.userId,
      raw.convertedSaleId ?? null,
      items,
      new Date(raw.createdAt),
      new Date(raw.updatedAt),
    );
  }
}
