import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAuditLogRepository } from '../../domain/interfaces/audit-log.interface.repository.js';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto.js';
import { AuditLogMapper } from '../../domain/mappers/audit-log.mapper.js';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto.js';

@Injectable()
export class CreateAuditLogUseCase {
  private readonly logger = new Logger(CreateAuditLogUseCase.name);
  constructor(
    @Inject('IAuditLogRepository')
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly mapper: AuditLogMapper,
  ) {}
  async execute(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    this.logger.log('Creating audit log');
    const auditLog = await this.auditLogRepository.create(dto);
    return this.mapper.toResponseDto(auditLog);
  }
}
