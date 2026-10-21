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
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class SyncQueueScheduler {
  private readonly logger = new Logger(SyncQueueScheduler.name);

  constructor(
    private readonly processUseCase: ProcessSyncQueueUseCase,
    private readonly retryUseCase:   RetryFailedItemsUseCase,
    private readonly repo:           PrismaSyncQueueRepository,
    private readonly prisma:         PrismaService,
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
   * Nettoyage automatique quotidien de la base de données.
   * Exécuté chaque nuit à 03:00 pour libérer l'espace disque.
   */
  @Cron('0 3 * * *')
  async handleCleanup(): Promise<void> {
    this.logger.log('🧹 [CRON] Nettoyage et maintenance de la base de données en cours...');
    try {
      // 1. syncQueue: supprimer les éléments synchronisés de plus de 7 jours (au lieu de 30)
      const deletedSyncQueue = await this.repo.deleteSyncedOlderThan(7);

      // 2. changeLog: supprimer les changements de plus de 14 jours
      const thresholdChangeLog = new Date();
      thresholdChangeLog.setDate(thresholdChangeLog.getDate() - 14);
      const deletedChangeLog = await this.prisma.changeLog.deleteMany({
        where: { changedAt: { lt: thresholdChangeLog } },
      });

      // 3. auditLog: supprimer les logs d'audit anciens de plus de 30 jours
      const thresholdAudit = new Date();
      thresholdAudit.setDate(thresholdAudit.getDate() - 30);
      const deletedAudit = await this.prisma.auditLog.deleteMany({
        where: { createdAt: { lt: thresholdAudit } },
      });

      this.logger.log(
        `🧹 [CRON] Nettoyage terminé : ` +
        `${deletedSyncQueue} item(s) syncQueue (>7j), ` +
        `${deletedChangeLog.count} changeLog(s) (>14j), ` +
        `${deletedAudit.count} auditLog(s) (>30j) supprimés.`,
      );
    } catch (err) {
      this.logger.error('[CRON] Erreur lors du nettoyage de la base de données', err);
    }
  }
}
