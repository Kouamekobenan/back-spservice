import { Inject, Injectable } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(): Promise<Customer[]> {
    return await this.customerRepository.getAllCustomers();
  }
}
