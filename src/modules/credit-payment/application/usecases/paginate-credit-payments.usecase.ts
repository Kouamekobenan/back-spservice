import { Inject, Injectable } from '@nestjs/common';
import { type ICreditPaymentRepository } from '../../domain/interfaces/credit-payment.interface.repository.js';
import { CreditPayment } from '../../domain/entities/credit-payment.entity.js';
import { PaginateCreditPaymentQueryDto } from '../dtos/paginate-credit-payment-query.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class PaginateCreditPaymentsUseCase {
  constructor(
    @Inject('ICreditPaymentRepository')
    private readonly paymentRepository: ICreditPaymentRepository,
  ) {}

  async execute(
    query: PaginateCreditPaymentQueryDto,
  ): Promise<PaginatedResponseRepository<CreditPayment>> {
    const { page = 1, limit = 10, ...filters } = query;
    return await this.paymentRepository.paginate(page, limit, filters);
  }
}
