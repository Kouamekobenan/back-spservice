// ================================================================
// APPLICATION LAYER — UC2 : ProcessSyncQueueUseCase
// Moteur principal de synchronisation.
// Récupère les items PENDING par batch et les dispatch selon entityType.
// Appelle les entités domaine existantes (Sale, Product, etc.)
// via Prisma pour les appliquer.
// ================================================================

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import {
  SyncQueueItem,
  SyncOperation,
} from '../../domain/entities/sync-queue.entity';
import { ProcessSyncResultDto } from '../dtos/sync-queue.dto';
import { PrismaService } from '../../../../prisma/prisma.service';

// ── Dispatcher par type d'entité ──────────────────────────────

/**
 * Dispatch un item de sync vers l'opération Prisma correcte.
 * Applique les règles métier de chaque entité (via le modèle Prisma).
 *
 * Retourne l'ID serveur résultant (pour les CREATE) ou l'ID existant.
 */
async function dispatchSyncItem(
  item: SyncQueueItem,
  prisma: PrismaService,
): Promise<string> {
  const { entityType, operation, payload, localId } = item;

  switch (entityType) {
    // ── Sale ────────────────────────────────────────────────
    case 'Sale': {
      if (operation === SyncOperation.CREATE) {
        // Vérifie si la vente existe déjà (idempotence par receiptNumber ou localId)
        const existing = await prisma.sale.findFirst({
          where: { localId },
          select: { id: true },
        });
        if (existing) return existing.id;

        const created = await prisma.sale.create({
          data: {
            ...(payload as any),
            localId,
            syncStatus: 'SYNCED',
          },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.sale.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Sale avec localId="${localId}" introuvable pour UPDATE`);
        await prisma.sale.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      if (operation === SyncOperation.DELETE) {
        const target = await prisma.sale.findFirst({ where: { localId }, select: { id: true } });
        if (!target) return localId; // Déjà supprimé = idempotent
        await prisma.sale.update({ where: { id: target.id }, data: { status: 'VOIDED', syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Product ─────────────────────────────────────────────
    case 'Product': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.product.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.product.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.product.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Product avec localId="${localId}" introuvable`);
        await prisma.product.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      if (operation === SyncOperation.DELETE) {
        const target = await prisma.product.findFirst({ where: { localId }, select: { id: true } });
        if (!target) return localId;
        await prisma.product.update({ where: { id: target.id }, data: { isActive: false, syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Customer ─────────────────────────────────────────────
    case 'Customer': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.customer.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.customer.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.customer.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Customer avec localId="${localId}" introuvable`);
        await prisma.customer.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Expense ─────────────────────────────────────────────
    case 'Expense': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.expense.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.expense.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.expense.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Expense avec localId="${localId}" introuvable`);
        await prisma.expense.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── CashSession ──────────────────────────────────────────
    case 'CashSession': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.cashSession.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.cashSession.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.cashSession.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`CashSession avec localId="${localId}" introuvable`);
        await prisma.cashSession.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── StockMovement ────────────────────────────────────────
    case 'StockMovement': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.stockMovement.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.stockMovement.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      break;
    }

    // ── PurchaseOrder ────────────────────────────────────────
    case 'PurchaseOrder': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.purchaseOrder.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.purchaseOrder.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await prisma.purchaseOrder.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`PurchaseOrder avec localId="${localId}" introuvable`);
        await prisma.purchaseOrder.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── CreditPayment ────────────────────────────────────────
    case 'CreditPayment': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.creditPayment.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.creditPayment.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      break;
    }

    // ── StockTransfer ────────────────────────────────────────
    case 'StockTransfer': {
      if (operation === SyncOperation.CREATE) {
        const existing = await prisma.stockTransfer.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await prisma.stockTransfer.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      break;
    }

    default:
      throw new Error(`entityType non supporté par le dispatcher: "${entityType}"`);
  }

  throw new Error(`Opération "${operation}" non supportée pour entityType "${entityType}"`);
}

// ── Use Case ─────────────────────────────────────────────────

@Injectable()
export class ProcessSyncQueueUseCase {
  private readonly logger = new Logger(ProcessSyncQueueUseCase.name);

  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Traite un batch d'items PENDING.
   * @param batchSize Nombre max d'items à traiter par appel (défaut: 50)
   */
  async execute(batchSize = 50): Promise<ProcessSyncResultDto> {
    const startTime = Date.now();

    // 1. Charger le batch PENDING (ordonnés par createdAt = FIFO)
    const pendingItems = await this.repo.findPending(batchSize);

    if (pendingItems.length === 0) {
      this.logger.log('Aucun item PENDING à traiter.');
      return {
        processed:  0,
        succeeded:  0,
        failed:     0,
        conflicts:  0,
        durationMs: Date.now() - startTime,
        syncedIds:  [],
        errors:     [],
      };
    }

    this.logger.log(`Traitement de ${pendingItems.length} item(s) PENDING...`);

    const syncedIds: string[] = [];
    const errors:   Array<{ id: string; localId: string; entityType: string; error: string }> = [];
    let conflictCount = 0;

    // 2. Traiter chaque item séquentiellement (évite les race conditions)
    for (const item of pendingItems) {
      try {
        // Dispatcher appelle les entités domaine (Prisma)
        const resolvedId = await dispatchSyncItem(item, this.prisma);

        // Marquer comme synchronisé via la logique domaine
        item.markAsSynced(resolvedId);
        await this.repo.save(item);

        syncedIds.push(item.id);
        this.logger.debug(`[${item.entityType}] ${item.localId} → ${resolvedId}`);

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Détection de conflits (doublon de clé unique, contrainte d'intégrité…)
        const isConflict =
          errorMsg.includes('Unique constraint') ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('conflit');

        if (isConflict) {
          item.markAsConflict(errorMsg);
          conflictCount++;
          this.logger.warn(`⚡ CONFLICT [${item.entityType}] ${item.localId}: ${errorMsg}`);
        } else {
          item.markAsError(errorMsg);
          this.logger.error(`❌ ERROR [${item.entityType}] ${item.localId}: ${errorMsg}`);
        }
        await this.repo.save(item);
        errors.push({
          id:         item.id,
          localId:    item.localId,
          entityType: item.entityType,
          error:      errorMsg,
        });
      }
    }
    const result: ProcessSyncResultDto = {
      processed:  pendingItems.length,
      succeeded:  syncedIds.length,
      failed:     errors.length - conflictCount,
      conflicts:  conflictCount,
      durationMs: Date.now() - startTime,
      syncedIds,
      errors,
    };
    this.logger.log(
      `Sync terminée: ${result.succeeded} OK | ${result.failed} erreurs | ${result.conflicts} conflits | ${result.durationMs}ms`,
    );
    return result;
  }
}
