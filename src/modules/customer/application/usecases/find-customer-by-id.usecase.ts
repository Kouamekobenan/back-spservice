import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';

@Injectable()
export class FindCustomerByIdUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.getCustomerById(id);
    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }
    return customer;
  }
}
