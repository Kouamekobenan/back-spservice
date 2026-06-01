import { Injectable } from '@nestjs/common';
import { Prisma, AuditLog as AuditLogPrisma } from '@prisma/client';
import { AuditLog } from '../entities/audit-log.entity.js';
import { CreateAuditLogDto } from '../../application/dto/create-audit-log.dto.js';
import { AuditLogResponseDto } from '../../application/dto/audit-log-response.dto.js';

@Injectable()
export class AuditLogMapper {
  toPersistence(data: CreateAuditLogDto): Prisma.AuditLogCreateInput {
    const hasUser = data.userId && data.userId !== 'SYSTEM';
    return {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      ...(hasUser ? { user: { connect: { id: data.userId } } } : {}),
      shop: { connect: { id: data.shopId } },
      dataBefore: data.dataBefore ?? Prisma.JsonNull,
      dataAfter: data.dataAfter ?? Prisma.JsonNull,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      notes: data.notes,
    };
  }

  toApplication(prismaEntity: AuditLogPrisma): AuditLog {
    return new AuditLog(
      prismaEntity.id,
      prismaEntity.action,
      prismaEntity.entityType,
      prismaEntity.entityId,
      prismaEntity.userId,
      prismaEntity.shopId,
      prismaEntity.dataBefore,
      prismaEntity.dataAfter,
      prismaEntity.ipAddress,
      prismaEntity.userAgent,
      prismaEntity.notes,
      prismaEntity.createdAt,
    );
  }

  toResponseDto(entity: AuditLog): AuditLogResponseDto {
    return {
      id: entity.getId(),
      action: entity.getAction(),
      entityType: entity.getEntityType(),
      entityId: entity.getEntityId(),
      userId: entity.getUserId(),
      shopId: entity.getShopId(),
      dataBefore: entity.getDataBefore(),
      dataAfter: entity.getDataAfter(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      notes: entity.getNotes(),
      createdAt: entity.getCreatedAt(),
    };
  }
}
