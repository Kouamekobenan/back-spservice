import { Customer } from '../entities/customer-entity.entity.js';
import { CreateCustomerDto } from '../../application/dtos/create-customer.dto.js';
import { UpdateCustomerDto } from '../../application/dtos/update-customer.dto.js';
import { FilterCustomerDto } from '../../application/dtos/filter-customer.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface ICustomerRepository {
  createCustomer(data: CreateCustomerDto): Promise<Customer>;
  getCustomerById(id: string): Promise<Customer | null>;
  getAllCustomers(): Promise<Customer[]>;
  updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  paginate(
    page: number,
    limit: number,
    search?: FilterCustomerDto,
  ): Promise<PaginatedResponseRepository<Customer>>;
}
