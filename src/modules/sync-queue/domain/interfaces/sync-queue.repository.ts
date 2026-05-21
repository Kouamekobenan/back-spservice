// ================================================================
// DOMAIN LAYER — Port du Repository SyncQueue
// Interface définie dans le domaine, implémentée dans l'infrastructure.
// Le domaine ne dépend pas de Prisma.
// ================================================================

import { SyncItemStatus, SyncQueueItem } from '../entities/sync-queue.entity';

// ── Types de filtres & résultats ──────────────────────────────

export interface SyncQueueFilters {
  status?:     SyncItemStatus;
  entityType?: string;
  fromDate?:   Date;
  toDate?:     Date;
  page?:       number;
  limit?:      number;
}

export interface PaginatedSyncQueue {
  items:      SyncQueueItem[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface SyncQueueStats {
  pending:   number;
  synced:    number;
  conflict:  number;
  error:     number;
  total:     number;
}

// ── Port (interface du repository) ────────────────────────────

/**
 * Port du repository SyncQueue.
 * Toutes les méthodes retournent des entités du domaine (SyncQueueItem).
 * L'infrastructure (Prisma) implémente ce contrat.
 */
export interface ISyncQueueRepository {
  /**
   * Persiste un nouvel item ou met à jour un existant.
   */
  save(item: SyncQueueItem): Promise<SyncQueueItem>;

  /**
   * Trouve un item par son ID serveur.
   */
  findById(id: string): Promise<SyncQueueItem | null>;

  /**
   * Trouve un item par localId + entityType (unicité offline).
   */
  findByLocalId(localId: string, entityType: string): Promise<SyncQueueItem | null>;

  /**
   * Récupère les items PENDING prêts à être traités, ordonnés par createdAt.
   * @param limit Nombre max d'items à récupérer (batch)
   */
  findPending(limit?: number): Promise<SyncQueueItem[]>;

  /**
   * Récupère les items en erreur qui peuvent encore être retentés.
   * @param maxRetries Seuil max de tentatives
   */
  findRetryable(maxRetries?: number): Promise<SyncQueueItem[]>;

  /**
   * Liste paginée avec filtres (pour l'API admin).
   */
  findAll(filters: SyncQueueFilters): Promise<PaginatedSyncQueue>;

  /**
   * Statistiques agrégées par statut.
   */
  countByStatus(): Promise<SyncQueueStats>;

  /**
   * Supprime les items synchronisés plus vieux que N jours (nettoyage).
   * @param olderThanDays Âge minimum en jours
   * @returns Nombre d'items supprimés
   */
  deleteSyncedOlderThan(olderThanDays: number): Promise<number>;
}
