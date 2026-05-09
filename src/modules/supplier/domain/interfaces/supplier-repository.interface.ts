import { Supplier } from '../entities/supplier-entity.entity.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { CreateSupplierDto } from '../../application/dtos/create-supplier-dto.dto.js';
import { SupplierQueryDto } from '../../application/dtos/supplier-query.dto.js';
import { UpdateSupplierDto } from '../../application/dtos/update-supplier-dto.dto.js';

export interface ISupplierRepository {
  create(data: CreateSupplierDto): Promise<Supplier>;
  findById(id: string): Promise<Supplier | null>;
  findAll(query: SupplierQueryDto): Promise<PaginatedResponseRepository<Supplier>>;
  update(id: string, data: UpdateSupplierDto): Promise<Supplier>;
  delete(id: string): Promise<void>;
}
