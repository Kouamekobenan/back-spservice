import { Module } from '@nestjs/common';
import { AuditLogController } from './presentation/controllers/audit-log.controller.js';
import { CreateAuditLogUseCase } from './application/use-cases/create-audit-log.use-case.js';
import { FindAllAuditLogsUseCase } from './application/use-cases/find-all-audit-logs.use-case.js';
import { FindAuditLogByIdUseCase } from './application/use-cases/find-audit-log-by-id.use-case.js';
import { AuditLogRepository } from './infrastructure/repository/audit-log.repository.js';
import { AuditLogMapper } from './domain/mappers/audit-log.mapper.js';
import { AuditLogListener } from './application/listeners/audit-log.listener.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [
    AuditLogMapper,
    AuditLogListener,
    CreateAuditLogUseCase,
    FindAllAuditLogsUseCase,
    FindAuditLogByIdUseCase,
    {
      provide: 'IAuditLogRepository',
      useClass: AuditLogRepository,
    },
  ],
  exports: [CreateAuditLogUseCase],
})
export class AuditLogModule {}
