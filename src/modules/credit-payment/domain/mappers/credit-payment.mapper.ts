import { Injectable } from '@nestjs/common';
import { CreditPayment } from '../entities/credit-payment.entity.js';
import { CreateCreditPaymentDto } from '../../application/dtos/create-credit-payment.dto.js';
import { Prisma, CreditPayment as CreditPaymentPrisma } from '@prisma/client';

@Injectable()
export class CreditPaymentMapper {
  toPersistence(data: CreateCreditPaymentDto): Prisma.CreditPaymentCreateInput {
    return {
      customer: { connect: { id: data.customerId } },
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      localId: data.localId,
    };
  }

  toApplication(paymentData: CreditPaymentPrisma): CreditPayment {
    return new CreditPayment(
      paymentData.id,
      paymentData.customerId,
      paymentData.amount,
      paymentData.method,
      paymentData.reference,
      paymentData.notes,
      paymentData.syncStatus,
      paymentData.localId,
      paymentData.createdAt,
    );
  }
}
