import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, StockMovementReason, PaymentMethod } from '@prisma/client';
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

        const { items: rawItems = [], payments: rawPayments = [], ...saleData } = payload as any;

        // 1. Résout cashSessionId local → UUID serveur (via table cash_sessions en priorité, puis sync_queue)
        let resolvedCashSessionId: string | null = saleData['cashSessionId'] ?? null;
        if (resolvedCashSessionId) {
          const directSession = await tx.cashSession.findFirst({
            where: { OR: [{ id: resolvedCashSessionId }, { localId: resolvedCashSessionId }] },
            select: { id: true },
          });
          if (directSession) {
            resolvedCashSessionId = directSession.id;
          } else {
            const sessionItem = await tx.syncQueue.findFirst({
              where: { localId: resolvedCashSessionId, entityType: 'CashSession' },
              select: { resolvedId: true, syncStatus: true },
            });
            if (sessionItem?.resolvedId) {
              resolvedCashSessionId = sessionItem.resolvedId;
            } else if (sessionItem && sessionItem.syncStatus === 'PENDING') {
              throw new Error(
                `CashSession "${resolvedCashSessionId}" pas encore synchronisée — la vente sera retraitée après la session`,
              );
            } else {
              // Session orpheline ou supprimée : ne pas bloquer la vente en caisse
              resolvedCashSessionId = null;
            }
          }
        }

        // 2. Résout customerId local → UUID serveur
        let resolvedCustomerId: string | null = saleData['customerId'] ?? null;
        if (resolvedCustomerId) {
          const directCustomer = await tx.customer.findFirst({
            where: { OR: [{ id: resolvedCustomerId }, { localId: resolvedCustomerId }] },
            select: { id: true },
          });
          if (directCustomer) {
            resolvedCustomerId = directCustomer.id;
          } else {
            const customerItem = await tx.syncQueue.findFirst({
              where: { localId: resolvedCustomerId, entityType: 'Customer' },
              select: { resolvedId: true, syncStatus: true },
            });
            if (customerItem?.resolvedId) {
              resolvedCustomerId = customerItem.resolvedId;
            } else if (customerItem && customerItem.syncStatus === 'PENDING') {
              throw new Error(
                `Customer "${resolvedCustomerId}" pas encore synchronisé — la vente sera retraitée après le client`,
              );
            } else {
              resolvedCustomerId = null;
            }
          }
        }

        // 3. Génère receiptNumber si absent (ventes créées hors-ligne)
        let receiptNumber: string = saleData['receiptNumber'];
        if (!receiptNumber) {
          const now = new Date();
          const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
          const startOfDay = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
          );
          const count = await tx.sale.count({
            where: {
              shopId: saleData['shopId'],
              createdAt: { gte: startOfDay },
            },
          });
          receiptNumber = `SP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
        }

        // 4. Résout chaque produit (par id ou localId) et enrichit les lignes de vente
        const enrichedItems = await Promise.all(
          (rawItems as Array<any>).map(async (it: any) => {
            const product = await tx.product.findFirst({
              where: { OR: [{ id: it.productId }, { localId: it.productId }] },
              select: { id: true, name: true, sku: true, stockQty: true },
            });
            if (!product) {
              throw new Error(`Produit "${it.productId}" introuvable pour la vente "${localId}"`);
            }
            const qty = Number(it.quantity);
            const unitPrice = Number(it.unitPrice);
            const discount = Number(it.discount ?? 0);
            const totalPrice =
              it.totalPrice != null
                ? Number(it.totalPrice)
                : Math.max(0, (unitPrice - discount) * qty);

            return {
              productId: product.id,
              productName: it.productName || product.name || 'Produit inconnu',
              productSku: it.productSku ?? product.sku ?? null,
              quantity: qty,
              unitPrice,
              discount,
              totalPrice,
              currentStockQty: Number(product.stockQty),
            };
          }),
        );

        // 5. Calcul cohérent des montants et du statut
        const computedSubtotal = enrichedItems.reduce((sum, it) => sum + it.totalPrice, 0);
        const subtotal = saleData['subtotal'] != null ? Number(saleData['subtotal']) : computedSubtotal;
        const discountAmount = Number(saleData['discountAmount'] ?? 0);
        const taxAmount = Number(saleData['taxAmount'] ?? 0);
        const totalAmount =
          saleData['totalAmount'] != null
            ? Number(saleData['totalAmount'])
            : Math.max(0, subtotal - discountAmount + taxAmount);

        const normalizedPayments = (rawPayments as Array<any>).map((p: any) => ({
          method: p.method as PaymentMethod,
          amount: Number(p.amount),
          reference: p.reference ?? null,
        }));

        const totalTendered = normalizedPayments.reduce((sum, p) => sum + p.amount, 0);
        const creditAmount = normalizedPayments
          .filter((p) => p.method === PaymentMethod.CREDIT)
          .reduce((sum, p) => sum + p.amount, 0);
        const nonCreditTendered = totalTendered - creditAmount;

        const amountDueImmediate = Math.max(0, totalAmount - creditAmount);
        const changeAmount =
          saleData['changeAmount'] != null
            ? Number(saleData['changeAmount'])
            : Math.max(0, nonCreditTendered - amountDueImmediate);
        const paidAmount =
          saleData['paidAmount'] != null
            ? Number(saleData['paidAmount'])
            : Math.max(0, nonCreditTendered - changeAmount);

        const totalDebtToAdd = creditAmount + Math.max(0, totalAmount - totalTendered);
        const status =
          saleData['status'] ?? (totalDebtToAdd > 0 && resolvedCustomerId ? 'PARTIALLY_PAID' : 'COMPLETED');

        // 6. Création de la vente avec filtrage strict des colonnes (évite PrismaClientValidationError)
        const created = await tx.sale.create({
          data: {
            receiptNumber,
            status,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paidAmount,
            changeAmount,
            notes: saleData['notes'] ?? null,
            shopId: saleData['shopId'],
            userId: saleData['userId'],
            customerId: resolvedCustomerId,
            cashSessionId: resolvedCashSessionId,
            originalSaleId: saleData['originalSaleId'] ?? null,
            ...(saleData['createdAt'] ? { createdAt: new Date(saleData['createdAt']) } : {}),
            localId,
            syncStatus: 'SYNCED',
            items: {
              create: enrichedItems.map(({ currentStockQty: _s, ...itemProps }) => itemProps),
            },
            payments: {
              create: normalizedPayments,
            },
          },
          select: { id: true },
        });

        // 7. Mise à jour du stock et création des mouvements (si non déjà envoyés séparément)
        const runningStock = new Map<string, number>();
        for (const it of enrichedItems) {
          if (!runningStock.has(it.productId)) {
            runningStock.set(it.productId, it.currentStockQty);
          }
        }

        for (const it of enrichedItems) {
          const existingMovement = await tx.stockMovement.findFirst({
            where: {
              productId: it.productId,
              OR: [{ saleId: created.id }, { saleId: localId }],
            },
            select: { id: true },
          });

          if (!existingMovement) {
            const stockBefore = runningStock.get(it.productId) ?? 0;
            const stockAfter = stockBefore - it.quantity;
            runningStock.set(it.productId, stockAfter);

            await Promise.all([
              tx.product.update({
                where: { id: it.productId },
                data: { stockQty: { decrement: it.quantity } },
              }),
              tx.stockMovement.create({
                data: {
                  productId: it.productId,
                  shopId: saleData['shopId'],
                  userId: saleData['userId'],
                  reason: StockMovementReason.SALE,
                  quantity: -it.quantity,
                  stockBefore,
                  stockAfter,
                  saleId: created.id,
                  syncStatus: 'SYNCED',
                },
              }),
            ]);
          }
        }

        // 8. Mise à jour de la dette client si vente à crédit ou partiellement payée
        if (totalDebtToAdd > 0 && resolvedCustomerId) {
          await tx.customer.update({
            where: { id: resolvedCustomerId },
            data: { totalDebt: { increment: totalDebtToAdd } },
          });
        }

        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.sale.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`Sale localId="${localId}" introuvable pour UPDATE`);
        const { id: _id, items: _items, payments: _payments, ...updateData } = payload as any;
        await tx.sale.update({ where: { id: target.id }, data: { ...updateData, syncStatus: 'SYNCED' } });
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
        // Cherche d'abord par localId, sinon par le vrai UUID (session ouverte en ligne)
        let target = await tx.cashSession.findFirst({ where: { localId }, select: { id: true } });
        if (!target && (payload as any)['id']) {
          target = await tx.cashSession.findUnique({ where: { id: (payload as any)['id'] }, select: { id: true } });
        }
        if (!target) throw new Error(`CashSession localId="${localId}" introuvable`);
        const { id: _id, ...sessionData } = payload as any;
        await tx.cashSession.update({
          where: { id: target.id },
          data: { ...sessionData, localId, syncStatus: 'SYNCED' },
        });
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
        const { items: rawItems = [], ...orderData } = payload as any;
        const created = await tx.purchaseOrder.create({
          data: {
            ...orderData,
            localId,
            syncStatus: 'SYNCED',
            items: {
              create: (rawItems as Array<any>).map((it: any) => ({
                productId:        it.productId,
                quantityOrdered:  it.quantityOrdered,
                quantityReceived: it.quantityReceived ?? 0,
                unitCost:         it.unitCost,
                totalCost:        it.totalCost ?? Number(it.quantityOrdered) * Number(it.unitCost),
              })),
            },
          },
          select: { id: true },
        });
        return created.id;
      }
      if (operation === SyncOperation.UPDATE) {
        const target = await tx.purchaseOrder.findFirst({ where: { localId }, select: { id: true } });
        if (!target) throw new Error(`PurchaseOrder localId="${localId}" introuvable`);
        const { items: _items, ...orderData } = payload as any;
        await tx.purchaseOrder.update({ where: { id: target.id }, data: { ...orderData, syncStatus: 'SYNCED' } });
        return target.id;
      }
      break;
    }

    // ── CreditPayment ────────────────────────────────────────
    case 'CreditPayment': {
      if (operation === SyncOperation.CREATE) {
        const existing = await tx.creditPayment.findFirst({ where: { localId }, select: { id: true } });
        if (existing) return existing.id;

        const rawPayload = payload as any;
        const customer = await tx.customer.findFirst({
          where: { OR: [{ id: rawPayload['customerId'] }, { localId: rawPayload['customerId'] }] },
          select: { id: true, totalDebt: true },
        });
        if (!customer) {
          throw new Error(`Client "${rawPayload['customerId']}" introuvable pour CreditPayment "${localId}"`);
        }

        const amount = Number(rawPayload['amount']);
        const created = await tx.creditPayment.create({
          data: {
            customerId: customer.id,
            amount,
            method: rawPayload['method'] as PaymentMethod,
            reference: rawPayload['reference'] ?? null,
            notes: rawPayload['notes'] ?? null,
            localId,
            syncStatus: 'SYNCED',
          },
          select: { id: true },
        });

        const newDebt = Math.max(0, Number(customer.totalDebt) - amount);
        await tx.customer.update({
          where: { id: customer.id },
          data: { totalDebt: newDebt },
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
    const rawPending = await this.repo.findPending(batchSize);

    // Priorité de traitement: les entités référencées doivent passer avant celles qui les référencent
    const ENTITY_PRIORITY: Record<string, number> = {
      CashSession:   0,
      Product:       1,
      Customer:      2,
      Expense:       3,
      StockMovement: 4,
      PurchaseOrder: 5,
      CreditPayment: 6,
      StockTransfer: 7,
      Sale:          8, // en dernier car référence CashSession, Product, Customer
    };
    const pendingItems = rawPending.sort((a, b) => {
      const pa = ENTITY_PRIORITY[a.entityType] ?? 50;
      const pb = ENTITY_PRIORITY[b.entityType] ?? 50;
      return pa !== pb ? pa - pb : a.createdAt.getTime() - b.createdAt.getTime();
    });

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
        const resolvedId = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
