import { Inject, Injectable } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<void> {
    return await this.customerRepository.deleteCustomer(id);
  }
}
