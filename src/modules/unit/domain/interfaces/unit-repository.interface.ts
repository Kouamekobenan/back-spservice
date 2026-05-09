import { Unit } from '../entities/unit.entity.js';
import { CreateUnitDto } from '../../application/dtos/create-unit.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { UnitQueryDto } from '../../application/dtos/unit-query.dto.js';
import { UpdateUnitDto } from '../../application/dtos/update-unit.dto.js';

export interface IUnitRepository {
  create(data: CreateUnitDto): Promise<Unit>;
  findById(id: string): Promise<Unit | null>;
  findAll(query: UnitQueryDto): Promise<PaginatedResponseRepository<Unit>>;
  update(id: string, data: UpdateUnitDto): Promise<Unit>;
  delete(id: string): Promise<void>;
}
