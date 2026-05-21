// ================================================================
// APPLICATION LAYER — Mapper SyncQueueItem → DTO
// Sépare la logique de transformation du domaine vers la présentation.
// ================================================================

import { SyncQueueItem, SyncOperation, SyncItemStatus } from '../../domain/entities/sync-queue.entity';
import { SyncQueueItemResponseDto } from '../dtos/sync-queue.dto';

export function toResponseDto(item: SyncQueueItem): SyncQueueItemResponseDto {
  return {
    id:          item.id,
    entityType:  item.entityType,
    localId:     item.localId,
    operation:   item.operation as SyncOperation,
    syncStatus:  item.syncStatus as SyncItemStatus,
    retryCount:  item.retryCount,
    lastError:   item.lastError,
    resolvedId:  item.resolvedId,
    createdAt:   item.createdAt,
    syncedAt:    item.syncedAt,
    canRetry:    item.canRetry(),
  };
}
