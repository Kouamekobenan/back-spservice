import { Injectable, BadRequestException } from '@nestjs/common';
import { ChangeLogService } from '../changelog.service.js';
import { PullQueryDto, PullResponseDto } from '../dtos/sync.dto.js';

@Injectable()
export class GetPullChangesUseCase {
  constructor(private readonly changeLogService: ChangeLogService) {}

  async execute(query: PullQueryDto): Promise<PullResponseDto> {
    const since = new Date(query.since);

    if (isNaN(since.getTime())) {
      throw new BadRequestException('Le paramètre "since" est une date ISO invalide');
    }

    // Refuser les requêtes trop larges (plus de 90 jours)
    const maxLookback = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    if (since < maxLookback) {
      throw new BadRequestException(
        'La plage de sync ne peut pas dépasser 90 jours. Utilisez GET /sync/snapshot pour une synchronisation initiale.',
      );
    }

    const entityTypes = query.entityTypes
      ? query.entityTypes.split(',').map((t) => t.trim())
      : undefined;

    const { changes, total, hasMore } = await this.changeLogService.getChangesSince(
      since,
      query.shopId,
      entityTypes,
      query.limit ?? 500,
      query.offset ?? 0,
    );

    const offset = query.offset ?? 0;
    const limit  = query.limit  ?? 500;

    return {
      since: since.toISOString(),
      serverTime: new Date().toISOString(),
      total,
      hasMore,
      nextOffset: hasMore ? offset + limit : offset,
      changes: changes.map((c: any) => ({
        id:         c.id,
        entityType: c.entityType,
        entityId:   c.entityId,
        operation:  c.operation,
        shopId:     c.shopId,
        payload:    c.payload,
        changedAt:  c.changedAt.toISOString(),
      })),
    };
  }
}
