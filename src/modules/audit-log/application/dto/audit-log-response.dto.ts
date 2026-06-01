import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string | null;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiProperty()
  shopId: string;

  @ApiProperty()
  dataBefore: any | null;

  @ApiProperty()
  dataAfter: any | null;

  @ApiProperty()
  ipAddress: string | null;

  @ApiProperty()
  userAgent: string | null;

  @ApiProperty()
  notes: string | null;

  @ApiProperty()
  createdAt: Date;
}
