import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { CreateAuditLogUseCase } from '../use-cases/create-audit-log.use-case.js';

@Injectable()
export class AuditLogListener {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly createAuditLogUseCase: CreateAuditLogUseCase) {}

  @OnEvent('audit.created')
  async handleAuditCreatedEvent(event: AuditEvent) {
    try {
      this.logger.debug(`Handling audit event for ${event.entityType}`);
      await this.createAuditLogUseCase.execute({
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        userId: event.userId,
        shopId: event.shopId,
        dataBefore: event.dataBefore,
        dataAfter: event.dataAfter,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        notes: event.notes,
      });
    } catch (error) {
      this.logger.error('Failed to process audit event', error instanceof Error ? error.stack : error);
    }
  }
}
