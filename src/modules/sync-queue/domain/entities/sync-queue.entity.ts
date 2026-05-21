// ================================================================
// DOMAIN LAYER — SyncQueue Entity & Value Objects
// Représentation pure du domaine, sans dépendance framework.
// ================================================================

// ── Value Objects ──────────────────────────────────────────────

/**
 * Opérations possibles dans la file de synchronisation.
 * Correspond aux types d'actions effectuées hors-ligne.
 */
export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Statuts du cycle de vie d'un item de synchronisation.
 * Miroir de l'enum Prisma SyncStatus pour l'isolation du domaine.
 */
export enum SyncItemStatus {
  PENDING   = 'PENDING',
  SYNCED    = 'SYNCED',
  CONFLICT  = 'CONFLICT',
  ERROR     = 'ERROR',
}

/**
 * Stratégies de résolution d'un conflit de synchronisation.
 */
export enum ConflictResolutionStrategy {
  KEEP_LOCAL  = 'KEEP_LOCAL',  // Appliquer le payload local (écrase serveur)
  KEEP_SERVER = 'KEEP_SERVER', // Ignorer le payload local (conserver serveur)
  MERGE       = 'MERGE',       // Merger manuellement (payload fourni)
}

/**
 * Value Object — Types d'entités synchronisables.
 * Garantit que seules les entités connues peuvent être enqueued.
 */
export class EntityType {
  private static readonly ALLOWED = new Set([
    'Sale',
    'StockMovement',
    'Product',
    'Customer',
    'Expense',
    'CashSession',
    'PurchaseOrder',
    'StockTransfer',
    'CreditPayment',
  ]);

  private constructor(public readonly value: string) {}

  static of(value: string): EntityType {
    if (!EntityType.ALLOWED.has(value)) {
      throw new Error(
        `Type d'entité non supporté: "${value}". Types autorisés: ${[...EntityType.ALLOWED].join(', ')}`,
      );
    }
    return new EntityType(value);
  }

  static allowedTypes(): string[] {
    return [...EntityType.ALLOWED];
  }

  equals(other: EntityType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// ── Interfaces de données primitives ──────────────────────────

export interface SyncQueueItemProps {
  id:          string;
  entityType:  string;
  localId:     string;
  payload:     Record<string, unknown>;
  operation:   SyncOperation;
  retryCount:  number;
  lastError:   string | null;
  syncStatus:  SyncItemStatus;
  resolvedId:  string | null;
  createdAt:   Date;
  syncedAt:    Date | null;
}

export interface CreateSyncQueueItemProps {
  id:         string;
  entityType: string;
  localId:    string;
  payload:    Record<string, unknown>;
  operation:  SyncOperation;
}

// ── Entité Agrégat ─────────────────────────────────────────────

/**
 * Entité principale du module SyncQueue.
 *
 * Règles métier :
 * - Un item SYNCED ou CONFLICT ne peut plus être modifié automatiquement.
 * - Le retryCount ne peut qu'augmenter.
 * - Un item n'est re-tentable que si retryCount < MAX_RETRIES.
 * - Le payload ne peut pas être vide.
 */
export class SyncQueueItem {
  static readonly MAX_RETRIES = 5;

  private constructor(private readonly props: SyncQueueItemProps) {}

  // ── Factory Methods ────────────────────────────────────────

  /**
   * Crée un nouvel item à partir de données brutes entrantes.
   * Valide les invariants du domaine.
   */
  static create(props: CreateSyncQueueItemProps): SyncQueueItem {
    // Validation de l'entityType via le Value Object
    EntityType.of(props.entityType);

    if (!props.localId || props.localId.trim() === '') {
      throw new Error('localId ne peut pas être vide');
    }

    if (!props.payload || Object.keys(props.payload).length === 0) {
      throw new Error('Le payload de synchronisation ne peut pas être vide');
    }

    if (!Object.values(SyncOperation).includes(props.operation)) {
      throw new Error(`Opération invalide: "${props.operation}"`);
    }

    return new SyncQueueItem({
      id:         props.id,
      entityType: props.entityType,
      localId:    props.localId,
      payload:    props.payload,
      operation:  props.operation,
      retryCount: 0,
      lastError:  null,
      syncStatus: SyncItemStatus.PENDING,
      resolvedId: null,
      createdAt:  new Date(),
      syncedAt:   null,
    });
  }

  /**
   * Reconstitue un item depuis la persistance (sans re-valider les invariants de création).
   */
  static reconstitute(props: SyncQueueItemProps): SyncQueueItem {
    return new SyncQueueItem(props);
  }

  // ── Getters (lecture seule) ────────────────────────────────

  get id():          string                    { return this.props.id; }
  get entityType():  string                    { return this.props.entityType; }
  get localId():     string                    { return this.props.localId; }
  get payload():     Record<string, unknown>   { return this.props.payload; }
  get operation():   SyncOperation             { return this.props.operation; }
  get retryCount():  number                    { return this.props.retryCount; }
  get lastError():   string | null             { return this.props.lastError; }
  get syncStatus():  SyncItemStatus            { return this.props.syncStatus; }
  get resolvedId():  string | null             { return this.props.resolvedId; }
  get createdAt():   Date                      { return this.props.createdAt; }
  get syncedAt():    Date | null               { return this.props.syncedAt; }

  // ── Logique Métier ─────────────────────────────────────────

  /**
   * Vérifie si l'item peut être retenté (n'a pas atteint le max de retries).
   */
  canRetry(): boolean {
    return this.props.retryCount < SyncQueueItem.MAX_RETRIES;
  }

  /**
   * Indique si l'item est en attente de traitement.
   */
  isPending(): boolean {
    return this.props.syncStatus === SyncItemStatus.PENDING;
  }

  /**
   * Indique si l'item est en erreur.
   */
  isError(): boolean {
    return this.props.syncStatus === SyncItemStatus.ERROR;
  }

  /**
   * Indique si l'item a un conflit à résoudre.
   */
  hasConflict(): boolean {
    return this.props.syncStatus === SyncItemStatus.CONFLICT;
  }

  /**
   * Marque l'item comme synchronisé avec succès.
   * @param resolvedId L'ID serveur attribué à l'entité après sync.
   */
  markAsSynced(resolvedId: string): void {
    if (!resolvedId || resolvedId.trim() === '') {
      throw new Error('resolvedId est requis pour marquer un item comme synchronisé');
    }
    this.props.syncStatus = SyncItemStatus.SYNCED;
    this.props.resolvedId = resolvedId;
    this.props.syncedAt   = new Date();
    this.props.lastError  = null;
  }

  /**
   * Marque l'item comme en erreur et incrémente le compteur.
   */
  markAsError(errorMessage: string): void {
    this.props.syncStatus = SyncItemStatus.ERROR;
    this.props.lastError  = errorMessage;
    this.props.retryCount += 1;
  }

  /**
   * Marque l'item comme étant en conflit (besoin d'une résolution manuelle).
   */
  markAsConflict(reason?: string): void {
    this.props.syncStatus = SyncItemStatus.CONFLICT;
    this.props.lastError  = reason ?? 'Conflit détecté lors de la synchronisation';
  }

  /**
   * Réinitialise l'item pour une nouvelle tentative (ERROR → PENDING).
   * Applique uniquement si canRetry() est vrai.
   */
  resetForRetry(): void {
    if (!this.canRetry()) {
      throw new Error(
        `L'item ${this.props.id} a atteint le maximum de tentatives (${SyncQueueItem.MAX_RETRIES})`,
      );
    }
    if (this.props.syncStatus !== SyncItemStatus.ERROR) {
      throw new Error(`Seuls les items en erreur peuvent être réinitialisés`);
    }
    this.props.syncStatus = SyncItemStatus.PENDING;
    this.props.lastError  = null;
  }

  /**
   * Applique une résolution manuelle de conflit.
   */
  resolveConflict(
    strategy: ConflictResolutionStrategy,
    mergedPayload?: Record<string, unknown>,
    resolvedId?: string,
  ): void {
    if (this.props.syncStatus !== SyncItemStatus.CONFLICT) {
      throw new Error(`Seuls les items en conflit peuvent être résolus manuellement`);
    }

    switch (strategy) {
      case ConflictResolutionStrategy.KEEP_LOCAL:
        // L'item retourne PENDING pour être retraité
        this.props.syncStatus = SyncItemStatus.PENDING;
        this.props.lastError  = null;
        break;

      case ConflictResolutionStrategy.KEEP_SERVER:
        // On abandonne le payload local, l'item est considéré synced
        if (!resolvedId) throw new Error('resolvedId requis pour KEEP_SERVER');
        this.markAsSynced(resolvedId);
        break;

      case ConflictResolutionStrategy.MERGE:
        // On remplace le payload par la version mergée
        if (!mergedPayload || Object.keys(mergedPayload).length === 0) {
          throw new Error('mergedPayload requis pour la stratégie MERGE');
        }
        this.props.payload    = mergedPayload;
        this.props.syncStatus = SyncItemStatus.PENDING;
        this.props.lastError  = null;
        break;
    }
  }

  /**
   * Exporte les props brutes pour la persistance.
   */
  toProps(): SyncQueueItemProps {
    return { ...this.props };
  }
}
