import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IAuditLogRepository } from '../../domain/interfaces/audit-log.interface.repository.js';
import { AuditLogMapper } from '../../domain/mappers/audit-log.mapper.js';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto.js';

@Injectable()
export class FindAuditLogByIdUseCase {
  constructor(
    @Inject('IAuditLogRepository')
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly mapper: AuditLogMapper,
  ) {}

  async execute(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogRepository.findById(id);
    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return this.mapper.toResponseDto(auditLog);
  }
}
