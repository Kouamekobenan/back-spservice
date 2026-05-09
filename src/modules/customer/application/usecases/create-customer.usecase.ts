import { Inject, Injectable } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';
import { CreateCustomerDto } from '../dtos/create-customer.dto.js';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(data: CreateCustomerDto): Promise<Customer> {
    try {
      return await this.customerRepository.createCustomer(data);
    } catch (error) {
      console.error('Erreur lors de la création du client');
      throw error;
    }
  }
}
