// ================================================================
// APPLICATION LAYER — UC4 : RetryFailedItemsUseCase
// Réinitialise les items en erreur (ERROR → PENDING) pour re-traitement.
// ================================================================

import { Injectable, Inject } from '@nestjs/common';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import { SyncQueueItem } from '../../domain/entities/sync-queue.entity';
import { RetryResultDto } from '../dtos/sync-queue.dto';

@Injectable()
export class RetryFailedItemsUseCase {
  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
  ) {}

  async execute(): Promise<RetryResultDto> {
    // 1. Récupérer tous les items en erreur pouvant encore être retentés
    const retryableItems = await this.repo.findRetryable(SyncQueueItem.MAX_RETRIES);

    let resetCount   = 0;
    let skippedCount = 0;

    // 2. Appliquer la logique domaine pour chaque item
    for (const item of retryableItems) {
      try {
        item.resetForRetry(); // Valide canRetry() + ERROR status
        await this.repo.save(item);
        resetCount++;
      } catch {
        // Si l'entité rejette le reset (max retries atteint, mauvais statut…)
        skippedCount++;
      }
    }

    return {
      totalRetryable:    retryableItems.length,
      resetToPending:    resetCount,
      skippedMaxRetries: skippedCount,
    };
  }
}
