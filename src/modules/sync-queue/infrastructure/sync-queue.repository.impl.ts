// ================================================================
// INFRASTRUCTURE LAYER — Prisma Repository Implementation
// Implémentation concrète du port ISyncQueueRepository.
// Toute interaction Prisma est ici. Le domaine reste pur.
// ================================================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ISyncQueueRepository,
  SyncQueueFilters,
  PaginatedSyncQueue,
  SyncQueueStats,
} from '../domain/interfaces/sync-queue.repository';
import {
  SyncQueueItem,
  SyncQueueItemProps,
  SyncOperation,
  SyncItemStatus,
} from '../domain/entities/sync-queue.entity';

// Conversion Prisma record → entité domaine
function toDomain(record: {
  id:         string;
  entityType: string;
  localId:    string;
  payload:    unknown;
  operation:  string;
  retryCount: number;
  lastError:  string | null;
  syncStatus: string;
  resolvedId: string | null;
  createdAt:  Date;
  syncedAt:   Date | null;
}): SyncQueueItem {
  return SyncQueueItem.reconstitute({
    id:         record.id,
    entityType: record.entityType,
    localId:    record.localId,
    payload:    record.payload as Record<string, unknown>,
    operation:  record.operation as SyncOperation,
    retryCount: record.retryCount,
    lastError:  record.lastError,
    syncStatus: record.syncStatus as SyncItemStatus,
    resolvedId: record.resolvedId,
    createdAt:  record.createdAt,
    syncedAt:   record.syncedAt,
  } satisfies SyncQueueItemProps);
}

@Injectable()
export class PrismaSyncQueueRepository implements ISyncQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── save (upsert) ─────────────────────────────────────────

  async save(item: SyncQueueItem): Promise<SyncQueueItem> {
    const props = item.toProps();

    const record = await this.prisma.syncQueue.upsert({
      where: { id: props.id },
      create: {
        id:         props.id,
        entityType: props.entityType,
        localId:    props.localId,
        payload:    props.payload as Prisma.InputJsonValue,
        operation:  props.operation,
        retryCount: props.retryCount,
        lastError:  props.lastError,
        syncStatus: props.syncStatus,
        resolvedId: props.resolvedId,
        createdAt:  props.createdAt,
        syncedAt:   props.syncedAt,
      },
      update: {
        retryCount: props.retryCount,
        lastError:  props.lastError,
        syncStatus: props.syncStatus,
        resolvedId: props.resolvedId,
        syncedAt:   props.syncedAt,
        payload:    props.payload as Prisma.InputJsonValue,
      },
    });

    return toDomain(record);
  }

  // ── findById ──────────────────────────────────────────────

  async findById(id: string): Promise<SyncQueueItem | null> {
    const record = await this.prisma.syncQueue.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  // ── findByLocalId ─────────────────────────────────────────

  async findByLocalId(localId: string, entityType: string): Promise<SyncQueueItem | null> {
    const record = await this.prisma.syncQueue.findFirst({
      where: { localId, entityType },
    });
    return record ? toDomain(record) : null;
  }

  // ── findPending ───────────────────────────────────────────

  async findPending(limit = 50): Promise<SyncQueueItem[]> {
    const records = await this.prisma.syncQueue.findMany({
      where:   { syncStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' }, // FIFO
      take:    limit,
    });
    return records.map(toDomain);
  }

  // ── findRetryable ─────────────────────────────────────────

  async findRetryable(maxRetries = SyncQueueItem.MAX_RETRIES): Promise<SyncQueueItem[]> {
    const records = await this.prisma.syncQueue.findMany({
      where: {
        syncStatus: 'ERROR',
        retryCount: { lt: maxRetries },
      },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toDomain);
  }

  // ── findAll (paginé) ──────────────────────────────────────

  async findAll(filters: SyncQueueFilters): Promise<PaginatedSyncQueue> {
    const page  = Math.max(filters.page  ?? 1, 1);
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.status)     where.syncStatus  = filters.status;
    if (filters.entityType) where.entityType  = filters.entityType;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate ? { gte: filters.fromDate } : {}),
        ...(filters.toDate   ? { lte: filters.toDate }   : {}),
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.syncQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.syncQueue.count({ where }),
    ]);

    return {
      items:      records.map(toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── countByStatus ─────────────────────────────────────────

  async countByStatus(): Promise<SyncQueueStats> {
    const [pending, synced, conflict, error] = await Promise.all([
      this.prisma.syncQueue.count({ where: { syncStatus: 'PENDING'  } }),
      this.prisma.syncQueue.count({ where: { syncStatus: 'SYNCED'   } }),
      this.prisma.syncQueue.count({ where: { syncStatus: 'CONFLICT' } }),
      this.prisma.syncQueue.count({ where: { syncStatus: 'ERROR'    } }),
    ]);

    return {
      pending,
      synced,
      conflict,
      error,
      total: pending + synced + conflict + error,
    };
  }

  // ── deleteSyncedOlderThan ─────────────────────────────────

  async deleteSyncedOlderThan(olderThanDays: number): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - olderThanDays);

    const result = await this.prisma.syncQueue.deleteMany({
      where: {
        syncStatus: 'SYNCED',
        syncedAt:   { lt: threshold },
      },
    });

    return result.count;
  }
}
