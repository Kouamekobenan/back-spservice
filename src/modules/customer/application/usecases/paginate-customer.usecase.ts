import { Inject, Injectable } from '@nestjs/common';
import { type ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';
import { PaginateCustomerQueryDto } from '../dtos/paginate-customer-query.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class PaginateCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}
  async execute(
    query: PaginateCustomerQueryDto,
  ): Promise<PaginatedResponseRepository<Customer>> {
    const { page = 1, limit = 10, ...filters } = query;
    return await this.customerRepository.paginate(page, limit, filters);
  }
}
