import { AuditAction } from '@prisma/client';

export class AuditLog {
  constructor(
    private readonly id: string,
    private readonly action: AuditAction,
    private readonly entityType: string,
    private readonly entityId: string | null,
    private readonly userId: string | null,
    private readonly shopId: string,
    private readonly dataBefore: any | null,
    private readonly dataAfter: any | null,
    private readonly ipAddress: string | null,
    private readonly userAgent: string | null,
    private readonly notes: string | null,
    private readonly createdAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getAction(): AuditAction {
    return this.action;
  }

  getEntityType(): string {
    return this.entityType;
  }

  getEntityId(): string | null {
    return this.entityId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getShopId(): string {
    return this.shopId;
  }

  getDataBefore(): any | null {
    return this.dataBefore;
  }

  getDataAfter(): any | null {
    return this.dataAfter;
  }

  getIpAddress(): string | null {
    return this.ipAddress;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  getNotes(): string | null {
    return this.notes;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
