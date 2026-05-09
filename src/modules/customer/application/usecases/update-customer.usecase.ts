import { Inject, Injectable } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';
import { UpdateCustomerDto } from '../dtos/update-customer.dto.js';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return await this.customerRepository.updateCustomer(id, data);
  }
}
