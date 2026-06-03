import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import { SyncQueueItem, SyncOperation } from '../../domain/entities/sync-queue.entity';
import { ProcessSyncResultDto } from '../dtos/sync-queue.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { validateSyncPayload } from '../payload-validators';
import { ChangeLogService } from '../../../sync/application/changelog.service';

// ── Dispatcher — exécuté à l'intérieur d'une $transaction ────────

async function dispatchSyncItem(
  item: SyncQueueItem,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const { entityType, operation, payload, localId } = item;

  switch (entityType) {
    // ── Sale ────────────────────────────────────────────────
    case 'Sale': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.sale.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.sale.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.sale.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Sale localId="${localId}" introuvable pour UPDATE`);
        await tx.sale.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      if (operation === SyncOperation.DELETE) {
        const target = await tx.sale.findFirst({ where: { localId }, select: { id: true } });
        if (!target) return localId;
        await tx.sale.update({ where: { id: target.id }, data: { status: 'VOIDED', syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Product ─────────────────────────────────────────────
    case 'Product': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.product.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.product.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.product.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Product localId="${localId}" introuvable`);
        await tx.product.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      if (operation === SyncOperation.DELETE) {
        const target = await tx.product.findFirst({ where: { localId }, select: { id: true } });
        if (!target) return localId;
        await tx.product.update({ where: { id: target.id }, data: { isActive: false, syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Customer ─────────────────────────────────────────────
    case 'Customer': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.customer.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.customer.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.customer.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Customer localId="${localId}" introuvable`);
        await tx.customer.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── Expense ─────────────────────────────────────────────
    case 'Expense': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.expense.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.expense.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.expense.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Expense localId="${localId}" introuvable`);
        await tx.expense.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── CashSession ──────────────────────────────────────────
    case 'CashSession': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.cashSession.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.cashSession.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.cashSession.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`CashSession localId="${localId}" introuvable`);
        await tx.cashSession.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── StockMovement ────────────────────────────────────────
    case 'StockMovement': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.stockMovement.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.stockMovement.create({
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
        const existing = await tx.purchaseOrder.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.purchaseOrder.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.purchaseOrder.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`PurchaseOrder localId="${localId}" introuvable`);
        await tx.purchaseOrder.update({ where: { id: target.id }, data: { ...(payload as any), syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── CreditPayment ────────────────────────────────────────
    case 'CreditPayment': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.creditPayment.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.creditPayment.create({
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
        const existing = await tx.stockTransfer.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;
        const created = await tx.stockTransfer.create({
          data: { ...(payload as any), localId, syncStatus: 'SYNCED' },
          select: { id: true },
        });
        return created.id;
      }
      break;
    }

    default:
      throw new Error(`entityType non supporté: "${entityType}"`);
  }

  throw new Error(`Opération "${operation}" non supportée pour "${entityType}"`);
}

// ── Use Case ─────────────────────────────────────────────────────

@Injectable()
export class ProcessSyncQueueUseCase {
  private readonly logger = new Logger(ProcessSyncQueueUseCase.name);

  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
    private readonly prisma: PrismaService,
    private readonly changeLog: ChangeLogService,
  ) {}

  async execute(batchSize = 50): Promise<ProcessSyncResultDto> {
    const startTime = Date.now();
    const pendingItems = await this.repo.findPending(batchSize);

    if (pendingItems.length === 0) {
      this.logger.log('Aucun item PENDING à traiter.');
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0, durationMs: 0, syncedIds: [], errors: [] };
    }

    this.logger.log(`Traitement de ${pendingItems.length} item(s) PENDING...`);

    const syncedIds: string[] = [];
    const errors: Array<{ id: string; localId: string; entityType: string; error: string }> = [];
    let conflictCount = 0;

    for (const item of pendingItems) {
      try {
        // 1. Validation métier du payload AVANT toute écriture
        validateSyncPayload(item.entityType, item.operation, item.payload);

        // 2. Dispatch dans une transaction atomique
        const resolvedId = await this.prisma.$transaction(async (tx) => {
          return dispatchSyncItem(item, tx);
        });

        item.markAsSynced(resolvedId);
        await this.repo.save(item);
        syncedIds.push(item.id);
        this.logger.debug(`[${item.entityType}] ${item.localId} → ${resolvedId}`);

        // Enregistrer dans le changelog pour que les autres clients puissent puller ce changement
        this.changeLog.track({
          entityType: item.entityType,
          entityId:   resolvedId,
          operation:  item.operation as 'CREATE' | 'UPDATE' | 'DELETE',
          shopId:     (item.payload['shopId'] as string | undefined) ?? null,
          payload:    { ...item.payload, id: resolvedId, syncStatus: 'SYNCED' },
        });

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
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
        errors.push({ id: item.id, localId: item.localId, entityType: item.entityType, error: errorMsg });
      }
    }

    const result: ProcessSyncResultDto = {
      processed: pendingItems.length,
      succeeded: syncedIds.length,
      failed: errors.length - conflictCount,
      conflicts: conflictCount,
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
