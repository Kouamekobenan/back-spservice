import { Inject, Injectable } from '@nestjs/common';
import type { IAuditLogRepository } from '../../domain/interfaces/audit-log.interface.repository.js';
import { FilterAuditLogDto } from '../dto/filter-audit-log.dto.js';
import { AuditLogMapper } from '../../domain/mappers/audit-log.mapper.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto.js';

@Injectable()
export class FindAllAuditLogsUseCase {
  constructor(
    @Inject('IAuditLogRepository')
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly mapper: AuditLogMapper,
  ) {}

  async execute(
    page: number,
    limit: number,
    filter?: FilterAuditLogDto,
  ): Promise<PaginatedResponseRepository<AuditLogResponseDto>> {
    const result = await this.auditLogRepository.paginate(page, limit, filter);
    
    return {
      ...result,
      data: result.data.map((log) => this.mapper.toResponseDto(log)),
    };
  }
}
