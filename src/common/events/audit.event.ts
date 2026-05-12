import { AuditAction } from '@prisma/client';

export class AuditEvent {
  constructor(
    public readonly action: AuditAction,
    public readonly entityType: string,
    public readonly entityId: string | undefined,
    public readonly userId: string,
    public readonly shopId: string,
    public readonly dataBefore?: any,
    public readonly dataAfter?: any,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly notes?: string,
  ) {}
}
