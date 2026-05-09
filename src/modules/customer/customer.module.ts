import { Module } from '@nestjs/common';
import { CustomerController } from './presentation/controllers/customer.controller.js';
import { CustomerRepository } from './infrastructure/repository/customer.repository.js';
import { CustomerMapper } from './domain/mappers/customer.mapper.js';
import { CreateCustomerUseCase } from './application/usecases/create-customer.usecase.js';
import { FindAllCustomersUseCase } from './application/usecases/find-all-customers.usecase.js';
import { FindCustomerByIdUseCase } from './application/usecases/find-customer-by-id.usecase.js';
import { UpdateCustomerUseCase } from './application/usecases/update-customer.usecase.js';
import { DeleteCustomerUseCase } from './application/usecases/delete-customer.usecase.js';
import { PaginateCustomerUseCase } from './application/usecases/paginate-customer.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  imports: [],
  controllers: [CustomerController],
  providers: [
    PrismaService,
    // Use cases
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindCustomerByIdUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    PaginateCustomerUseCase,

    // Repository (injection par interface)
    {
      provide: 'ICustomerRepository',
      useClass: CustomerRepository,
    },

    // Mapper
    CustomerMapper,
  ],
  exports: [
    CreateCustomerUseCase,
    FindAllCustomersUseCase,
    FindCustomerByIdUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    PaginateCustomerUseCase,
  ],
})
export class CustomerModule {}
