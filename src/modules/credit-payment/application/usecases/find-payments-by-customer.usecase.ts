import { Inject, Injectable } from '@nestjs/common';
import { type ICreditPaymentRepository } from '../../domain/interfaces/credit-payment.interface.repository.js';
import { CreditPayment } from '../../domain/entities/credit-payment.entity.js';

@Injectable()
export class FindPaymentsByCustomerUseCase {
  constructor(
    @Inject('ICreditPaymentRepository')
    private readonly paymentRepository: ICreditPaymentRepository,
  ) {}

  async execute(customerId: string): Promise<CreditPayment[]> {
    return await this.paymentRepository.getPaymentsByCustomer(customerId);
  }
}
