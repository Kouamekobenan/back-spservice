import { Sale as PrismaSale, SaleItem as PrismaSaleItem, SalePayment as PrismaSalePayment } from '@prisma/client';
import { Sale, SaleItem, SalePayment } from '../entities/sale.entity.js';

export class SaleMapper {
  toDomain(
    prismaSale: PrismaSale & { items: PrismaSaleItem[]; payments: PrismaSalePayment[] },
  ): Sale {
    const items = prismaSale.items.map(
      (item) =>
        new SaleItem(
          item.id,
          item.productId,
          item.productName,
          item.productSku,
          item.quantity,
          item.unitPrice,
          item.discount,
          item.totalPrice,
        ),
    );

    const payments = prismaSale.payments.map(
      (payment) =>
        new SalePayment(
          payment.id,
          payment.method,
          payment.amount,
          payment.reference,
          payment.createdAt,
        ),
    );

    return new Sale(
      prismaSale.id,
      prismaSale.receiptNumber,
      prismaSale.status,
      prismaSale.subtotal,
      prismaSale.discountAmount,
      prismaSale.taxAmount,
      prismaSale.totalAmount,
      prismaSale.paidAmount,
      prismaSale.changeAmount,
      prismaSale.notes,
      prismaSale.shopId,
      prismaSale.userId,
      prismaSale.customerId,
      prismaSale.cashSessionId,
      prismaSale.originalSaleId,
      items,
      payments,
      prismaSale.syncStatus,
      prismaSale.localId,
      prismaSale.createdAt,
      prismaSale.updatedAt,
    );
  }
}
