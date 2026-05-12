import { AuditLog } from '../entities/audit-log.entity.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { CreateAuditLogDto } from '../../application/dto/create-audit-log.dto.js';
import { FilterAuditLogDto } from '../../application/dto/filter-audit-log.dto.js';

export interface IAuditLogRepository {
  create(data: CreateAuditLogDto): Promise<AuditLog>;
  findById(id: string): Promise<AuditLog | null>;
  findAll(filter?: FilterAuditLogDto): Promise<AuditLog[]>;
  paginate(
    page: number,
    limit: number,
    filter?: FilterAuditLogDto,
  ): Promise<PaginatedResponseRepository<AuditLog>>;
}
