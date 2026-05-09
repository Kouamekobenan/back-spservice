import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ICreditPaymentRepository } from '../../domain/interfaces/credit-payment.interface.repository.js';
import { CreditPayment } from '../../domain/entities/credit-payment.entity.js';

@Injectable()
export class FindPaymentByIdUseCase {
  constructor(
    @Inject('ICreditPaymentRepository')
    private readonly paymentRepository: ICreditPaymentRepository,
  ) {}

  async execute(id: string): Promise<CreditPayment> {
    const payment = await this.paymentRepository.getPaymentById(id);
    if (!payment) {
      throw new NotFoundException(`Paiement avec l'ID ${id} non trouvé`);
    }
    return payment;
  }
}
