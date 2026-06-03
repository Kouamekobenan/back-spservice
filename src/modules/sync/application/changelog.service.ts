import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

export interface TrackChangeDto {
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  shopId?: string | null;
  payload: Record<string, unknown>;
}

@Injectable()
export class ChangeLogService {
  private readonly logger = new Logger(ChangeLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre une modification dans le changelog.
   * Appel fire-and-forget : n'interrompt jamais l'opération principale.
   */
  track(dto: TrackChangeDto): void {
    setImmediate(() => {
      this.prisma.changeLog
        .create({
          data: {
            entityType: dto.entityType,
            entityId:   dto.entityId,
            operation:  dto.operation,
            shopId:     dto.shopId ?? null,
            payload:    dto.payload as any,
            changedAt:  new Date(),
          },
        })
        .catch((err: unknown) =>
          this.logger.error(`Changelog write failed [${dto.entityType}:${dto.entityId}]`, err),
        );
    });
  }

  /**
   * Variante async quand on veut attendre la confirmation d'écriture.
   */
  async trackAsync(dto: TrackChangeDto): Promise<void> {
    await this.prisma.changeLog.create({
      data: {
        entityType: dto.entityType,
        entityId:   dto.entityId,
        operation:  dto.operation,
        shopId:     dto.shopId ?? null,
        payload:    dto.payload as any,
        changedAt:  new Date(),
      },
    });
  }

  /**
   * Récupère les changements depuis un timestamp donné.
   */
  async getChangesSince(
    since: Date,
    shopId?: string,
    entityTypes?: string[],
    limit = 500,
    offset = 0,
  ) {
    const where: any = { changedAt: { gt: since } };
    if (shopId) where.shopId = shopId;
    if (entityTypes?.length) where.entityType = { in: entityTypes };

    const [changes, total] = await Promise.all([
      this.prisma.changeLog.findMany({
        where,
        orderBy: { changedAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.changeLog.count({ where }),
    ]);

    return { changes, total, hasMore: offset + limit < total };
  }
}
