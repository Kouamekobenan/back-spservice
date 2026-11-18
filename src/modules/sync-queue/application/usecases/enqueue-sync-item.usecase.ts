// ================================================================
// APPLICATION LAYER — UC1 : EnqueueSyncItemUseCase
// Ajoute un item à la file de synchronisation.
// Vérifie l'unicité par (localId + entityType).
// ================================================================

import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import { SyncQueueItem } from '../../domain/entities/sync-queue.entity';
import { EnqueueSyncItemDto, SyncQueueItemResponseDto } from '../dtos/sync-queue.dto';
import { toResponseDto } from '../mappers/sync-queue.mapper';

@Injectable()
export class EnqueueSyncItemUseCase {
  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
  ) {}

  async execute(dto: EnqueueSyncItemDto): Promise<SyncQueueItemResponseDto> {
    // 1. Vérifier l'unicité (localId + entityType) de façon idempotente
    // Si le client renvoie le même item après une coupure réseau, on retourne l'item existant
    // (et s'il était en ERROR, on le remet en PENDING pour retraitement).
    const existing = await this.repo.findByLocalId(dto.localId, dto.entityType);
    if (existing) {
      if (existing.isError() && existing.canRetry()) {
        existing.resetForRetry();
        const savedExisting = await this.repo.save(existing);
        return toResponseDto(savedExisting);
      }
      return toResponseDto(existing);
    }

    // 2. Créer l'entité domaine (valide les invariants)
    let item: SyncQueueItem;
    try {
      item = SyncQueueItem.create({
        id:         randomUUID(),
        entityType: dto.entityType,
        localId:    dto.localId,
        payload:    dto.payload,
        operation:  dto.operation,
      });
    } catch (err: unknown) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Données invalides pour la création d\'un item de sync',
      );
    }

    // 3. Persister
    const saved = await this.repo.save(item);

    return toResponseDto(saved);
  }
}
