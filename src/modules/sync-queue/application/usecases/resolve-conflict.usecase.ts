// ================================================================
// APPLICATION LAYER — UC5 : ResolveConflictUseCase
// Permet à un admin de résoudre manuellement un conflit de sync.
// ================================================================

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ISyncQueueRepository } from '../../domain/interfaces/sync-queue.repository';
import { SyncItemStatus } from '../../domain/entities/sync-queue.entity';
import { ResolveSyncConflictDto, SyncQueueItemResponseDto } from '../dtos/sync-queue.dto';
import { toResponseDto } from '../mappers/sync-queue.mapper';

@Injectable()
export class ResolveConflictUseCase {
  constructor(
    @Inject('ISyncQueueRepository')
    private readonly repo: ISyncQueueRepository,
  ) {}

  async execute(id: string, dto: ResolveSyncConflictDto): Promise<SyncQueueItemResponseDto> {
    // 1. Récupérer l'item
    const item = await this.repo.findById(id);
    if (!item) {
      throw new NotFoundException(`Item de sync "${id}" introuvable`);
    }

    // 2. Vérifier qu'il est bien en conflit
    if (item.syncStatus !== SyncItemStatus.CONFLICT) {
      throw new BadRequestException(
        `L'item "${id}" n'est pas en statut CONFLICT (statut actuel: ${item.syncStatus})`,
      );
    }

    // 3. Appliquer la résolution via la logique domaine
    try {
      item.resolveConflict(dto.strategy, dto.mergedPayload, dto.resolvedId);
    } catch (err: unknown) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Paramètres de résolution invalides',
      );
    }

    // 4. Persister
    const saved = await this.repo.save(item);

    return toResponseDto(saved);
  }
}
