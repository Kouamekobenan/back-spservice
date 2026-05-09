import { Module } from '@nestjs/common';
import { CreditPaymentController } from './presentation/controllers/credit-payment.controller.js';
import { CreditPaymentRepository } from './infrastructure/repository/credit-payment.repository.js';
import { CreditPaymentMapper } from './domain/mappers/credit-payment.mapper.js';
import { CreateCreditPaymentUseCase } from './application/usecases/create-credit-payment.usecase.js';
import { FindPaymentsByCustomerUseCase } from './application/usecases/find-payments-by-customer.usecase.js';
import { FindPaymentByIdUseCase } from './application/usecases/find-payment-by-id.usecase.js';
import { PaginateCreditPaymentsUseCase } from './application/usecases/paginate-credit-payments.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  imports: [],
  controllers: [CreditPaymentController],
  providers: [
    PrismaService,
    // Use cases
    CreateCreditPaymentUseCase,
    FindPaymentsByCustomerUseCase,
    FindPaymentByIdUseCase,
    PaginateCreditPaymentsUseCase,

    // Repository
    {
      provide: 'ICreditPaymentRepository',
      useClass: CreditPaymentRepository,
    },

    // Mapper
    CreditPaymentMapper,
  ],
  exports: [
    CreateCreditPaymentUseCase,
    FindPaymentsByCustomerUseCase,
    FindPaymentByIdUseCase,
    PaginateCreditPaymentsUseCase,
  ],
})
export class CreditPaymentModule {}
