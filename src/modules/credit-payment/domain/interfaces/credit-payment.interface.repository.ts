import { CreditPayment } from '../entities/credit-payment.entity.js';
import { CreateCreditPaymentDto } from '../../application/dtos/create-credit-payment.dto.js';
import { FilterCreditPaymentDto } from '../../application/dtos/filter-credit-payment.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface ICreditPaymentRepository {
  createPayment(data: CreateCreditPaymentDto): Promise<CreditPayment>;
  getPaymentById(id: string): Promise<CreditPayment | null>;
  getPaymentsByCustomer(customerId: string): Promise<CreditPayment[]>;
  paginate(
    page: number,
    limit: number,
    search?: FilterCreditPaymentDto,
  ): Promise<PaginatedResponseRepository<CreditPayment>>;
}
