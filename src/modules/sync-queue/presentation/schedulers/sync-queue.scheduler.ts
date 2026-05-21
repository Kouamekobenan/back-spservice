// ================================================================
// PRESENTATION LAYER — Scheduler CRON
// Déclenche automatiquement le traitement de la file toutes les X min.
// ET nettoie les items SYNCED anciens périodiquement.
// ================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessSyncQueueUseCase } from '../../application/usecases/process-sync-queue.usecase.js';
import { RetryFailedItemsUseCase } from '../../application/usecases/retry-failed-items.usecase.js';
import { PrismaSyncQueueRepository } from '../../infrastructure/sync-queue.repository.impl.js';

@Injectable()
export class SyncQueueScheduler {
  private readonly logger = new Logger(SyncQueueScheduler.name);

  constructor(
    private readonly processUseCase: ProcessSyncQueueUseCase,
    private readonly retryUseCase:   RetryFailedItemsUseCase,
    private readonly repo:           PrismaSyncQueueRepository,
  ) {}

  /**
   * Traitement automatique toutes les 5 minutes.
   * Traite les items PENDING en batch de 100.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoProcess(): Promise<void> {
    this.logger.log('⏰ [CRON] Démarrage du traitement automatique de la SyncQueue...');
    try {
      const result = await this.processUseCase.execute(100);
      if (result.processed > 0) {
        this.logger.log(
          `✅ [CRON] Terminé: ${result.succeeded}/${result.processed} synchronisés | ` +
          `${result.failed} erreurs | ${result.conflicts} conflits | ${result.durationMs}ms`,
        );
      } else {
        this.logger.debug('[CRON] Aucun item PENDING — file vide.');
      }
    } catch (err) {
      this.logger.error('[CRON] Erreur lors du traitement automatique', err);
    }
  }

  /**
   * Retry automatique des items en erreur toutes les 15 minutes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleAutoRetry(): Promise<void> {
    this.logger.log('♻️  [CRON] Retry automatique des items en erreur...');
    try {
      const result = await this.retryUseCase.execute();
      if (result.totalRetryable > 0) {
        this.logger.log(
          `♻️  [CRON] ${result.resetToPending} items remis en PENDING | ${result.skippedMaxRetries} ignorés (max retries)`,
        );
      }
    } catch (err) {
      this.logger.error('[CRON] Erreur lors du retry automatique', err);
    }
  }

  /**
   * Nettoyage hebdomadaire des items SYNCED de plus de 30 jours.
   * Exécuté chaque dimanche à 02:00.
   */
  @Cron('0 2 * * 0')
  async handleCleanup(): Promise<void> {
    this.logger.log('🧹 [CRON] Nettoyage des items SYNCED anciens...');
    try {
      const deleted = await this.repo.deleteSyncedOlderThan(30);
      this.logger.log(`🧹 [CRON] ${deleted} item(s) SYNCED supprimés (> 30 jours)`);
    } catch (err) {
      this.logger.error('[CRON] Erreur lors du nettoyage', err);
    }
  }
}
