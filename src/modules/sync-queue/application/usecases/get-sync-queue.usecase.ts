// ================================================================
// APPLICATION LAYER — UC3 : GetSyncQueueUseCase
// Liste paginée de la file avec filtres (admin).
// ================================================================

import { Injectable, Inject } from '@nestjs/common';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import { GetSyncQueueQueryDto, PaginatedSyncQueueResponseDto, SyncQueueStatsDto } from '../dtos/sync-queue.dto';
import { toResponseDto } from '../mappers/sync-queue.mapper';
import { SyncItemStatus } from '../../domain/entities/sync-queue.entity';

@Injectable()
export class GetSyncQueueUseCase {
  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
  ) {}

  async execute(query: GetSyncQueueQueryDto): Promise<PaginatedSyncQueueResponseDto> {
    const result = await this.repo.findAll({
      status:     query.status,
      entityType: query.entityType,
      fromDate:   query.fromDate ? new Date(query.fromDate) : undefined,
      toDate:     query.toDate   ? new Date(query.toDate)   : undefined,
      page:       query.page  ?? 1,
      limit:      query.limit ?? 20,
    });

    return {
      items:      result.items.map(toResponseDto),
      total:      result.total,
      page:       result.page,
      limit:      result.limit,
      totalPages: result.totalPages,
    };
  }

  async getStats(): Promise<SyncQueueStatsDto> {
    return this.repo.countByStatus();
  }
}
