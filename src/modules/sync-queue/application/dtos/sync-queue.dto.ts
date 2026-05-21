// ================================================================
// APPLICATION LAYER — DTOs SyncQueue
// Data Transfer Objects pour les requêtes et réponses REST.
// Décorés pour Swagger + class-validator.
// ================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SyncOperation,
  SyncItemStatus,
  ConflictResolutionStrategy,
} from '../../domain/entities/sync-queue.entity';

// ── DTOs de Requête ───────────────────────────────────────────

/**
 * Body pour ajouter un item à la file de synchronisation.
 */
export class EnqueueSyncItemDto {
  @ApiProperty({
    description: 'Type de l\'entité à synchroniser',
    example: 'Sale',
    enum: ['Sale', 'StockMovement', 'Product', 'Customer', 'Expense', 'CashSession', 'PurchaseOrder', 'StockTransfer', 'CreditPayment'],
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'Identifiant local (UUID généré sur l\'appareil hors-ligne)',
    example: 'local_sale_2026-05-22_001',
  })
  @IsString()
  @IsNotEmpty()
  localId: string;

  @ApiProperty({
    description: 'Données complètes de l\'entité à synchroniser',
    example: { receiptNumber: 'VTE-001', totalAmount: 15000, items: [] },
  })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiProperty({
    description: 'Type d\'opération effectuée hors-ligne',
    enum: SyncOperation,
    example: SyncOperation.CREATE,
  })
  @IsEnum(SyncOperation)
  operation: SyncOperation;
}

/**
 * Query params pour lister la file avec filtres et pagination.
 */
export class GetSyncQueueQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: SyncItemStatus,
  })
  @IsOptional()
  @IsEnum(SyncItemStatus)
  status?: SyncItemStatus;

  @ApiPropertyOptional({
    description: 'Filtrer par type d\'entité',
    example: 'Sale',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)', example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)', example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Numéro de page (commence à 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'items par page (max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Body pour résoudre manuellement un conflit.
 */
export class ResolveSyncConflictDto {
  @ApiProperty({
    description: 'Stratégie de résolution du conflit',
    enum: ConflictResolutionStrategy,
    example: ConflictResolutionStrategy.KEEP_LOCAL,
  })
  @IsEnum(ConflictResolutionStrategy)
  strategy: ConflictResolutionStrategy;

  @ApiPropertyOptional({
    description: 'Payload mergé (requis si strategy = MERGE)',
    example: { resolvedField: 'value' },
  })
  @IsOptional()
  @IsObject()
  mergedPayload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'ID serveur (requis si strategy = KEEP_SERVER)',
    example: 'srv_uuid_xyz',
  })
  @IsOptional()
  @IsString()
  resolvedId?: string;
}

// ── DTOs de Réponse ───────────────────────────────────────────

/**
 * Réponse standard pour un item de la file de synchronisation.
 */
export class SyncQueueItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Sale' })
  entityType: string;

  @ApiProperty({ example: 'local_sale_001' })
  localId: string;

  @ApiProperty({ enum: SyncOperation })
  operation: SyncOperation;

  @ApiProperty({ enum: SyncItemStatus })
  syncStatus: SyncItemStatus;

  @ApiProperty({ example: 0 })
  retryCount: number;

  @ApiPropertyOptional({ example: 'Conflict: duplicate receiptNumber' })
  lastError: string | null;

  @ApiPropertyOptional({ example: 'srv_uuid_xyz' })
  resolvedId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  syncedAt: Date | null;

  @ApiProperty({ description: 'Peut-il encore être retenté?' })
  canRetry: boolean;
}

/**
 * Réponse paginée pour la liste de la file.
 */
export class PaginatedSyncQueueResponseDto {
  @ApiProperty({ type: [SyncQueueItemResponseDto] })
  items: SyncQueueItemResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/**
 * Statistiques de la file par statut.
 */
export class SyncQueueStatsDto {
  @ApiProperty({ example: 12 })
  pending: number;

  @ApiProperty({ example: 247 })
  synced: number;

  @ApiProperty({ example: 3 })
  conflict: number;

  @ApiProperty({ example: 5 })
  error: number;

  @ApiProperty({ example: 267 })
  total: number;
}

/**
 * Résultat du traitement d'un batch de synchronisation.
 */
export class ProcessSyncResultDto {
  @ApiProperty({ example: 10 })
  processed: number;

  @ApiProperty({ example: 8 })
  succeeded: number;

  @ApiProperty({ example: 1 })
  failed: number;

  @ApiProperty({ example: 1 })
  conflicts: number;

  @ApiProperty({ example: 250 })
  durationMs: number;

  @ApiProperty({ type: [String], description: 'IDs des items traités avec succès' })
  syncedIds: string[];

  @ApiProperty({ type: [Object], description: 'Détails des erreurs' })
  errors: Array<{ id: string; localId: string; entityType: string; error: string }>;
}

/**
 * Résultat du retry des items en erreur.
 */
export class RetryResultDto {
  @ApiProperty({ example: 5 })
  totalRetryable: number;

  @ApiProperty({ example: 5 })
  resetToPending: number;

  @ApiProperty({ example: 2 })
  skippedMaxRetries: number;
}
