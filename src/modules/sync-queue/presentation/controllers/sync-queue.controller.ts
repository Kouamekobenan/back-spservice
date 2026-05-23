import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/role.guard.js';
import { Roles } from '../../../auth/decorators/roles.decorators.js';
import { EnqueueSyncItemUseCase }   from '../../application/usecases/enqueue-sync-item.usecase.js';
import { GetSyncQueueUseCase }      from '../../application/usecases/get-sync-queue.usecase.js';
import { ProcessSyncQueueUseCase }  from '../../application/usecases/process-sync-queue.usecase.js';
import { RetryFailedItemsUseCase }  from '../../application/usecases/retry-failed-items.usecase.js';
import { ResolveConflictUseCase }   from '../../application/usecases/resolve-conflict.usecase.js';
import type { ISyncQueueRepository }     from '../../domain/interfaces/sync-queue.repository.js';
import { toResponseDto }            from '../../application/mappers/sync-queue.mapper.js';

import {
  EnqueueSyncItemDto,
  GetSyncQueueQueryDto,
  ResolveSyncConflictDto,
  SyncQueueItemResponseDto,
  PaginatedSyncQueueResponseDto,
  SyncQueueStatsDto,
  ProcessSyncResultDto,
  RetryResultDto,
} from '../../application/dtos/sync-queue.dto.js';

@ApiTags('sync-queue')
@Controller('sync-queue')
export class SyncQueueController {
  constructor(
    private readonly enqueueUseCase:        EnqueueSyncItemUseCase,
    private readonly getSyncQueueUseCase:    GetSyncQueueUseCase,
    private readonly processUseCase:         ProcessSyncQueueUseCase,
    private readonly retryUseCase:           RetryFailedItemsUseCase,
    private readonly resolveConflictUseCase: ResolveConflictUseCase,
    @Inject('ISyncQueueRepository')
    private readonly repo:ISyncQueueRepository,
  ) {}
  // ── POST /sync-queue ────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un item à la file de synchronisation',
    description: 'Enqueue une opération effectuée hors-ligne pour synchronisation avec le serveur.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: SyncQueueItemResponseDto, description: 'Item ajouté à la file' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cet item (localId + entityType) est déjà dans la file' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Payload invalide' })
  async enqueue(@Body() dto: EnqueueSyncItemDto): Promise<SyncQueueItemResponseDto> {
    return this.enqueueUseCase.execute(dto);
  }
  // ── GET /sync-queue/stats ──────────────────────────────────
  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques de la file par statut',
    description: 'Retourne le nombre d\'items PENDING, SYNCED, CONFLICT, ERROR.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SyncQueueStatsDto })
  async getStats(): Promise<SyncQueueStatsDto> {
    return this.getSyncQueueUseCase.getStats();
  }

  // ── GET /sync-queue ─────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Lister la file de synchronisation (paginée)',
    description: 'Liste tous les items avec filtres optionnels (status, entityType, dates).',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedSyncQueueResponseDto })
  async findAll(@Query() query: GetSyncQueueQueryDto): Promise<PaginatedSyncQueueResponseDto> {
    return this.getSyncQueueUseCase.execute(query);
  }

  // ── POST /sync-queue/process ───────────────────────────────
  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclencher manuellement le traitement de la file',
    description:
      'Traite un batch d\'items PENDING (max 50 par appel). ' +
      'Dispatche chaque item vers l\'entité domaine correspondante (Sale, Product, etc.).',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ProcessSyncResultDto })
  async process(): Promise<ProcessSyncResultDto> {
    return this.processUseCase.execute(50);
  }

  // ── POST /sync-queue/retry ─────────────────────────────────
  @Post('retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Relancer les items en erreur',
    description:
      'Réinitialise les items ERROR (qui n\'ont pas atteint MAX_RETRIES=5) en PENDING pour re-traitement.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RetryResultDto })
  async retry(): Promise<RetryResultDto> {
    return this.retryUseCase.execute();
  }

  // ── GET /sync-queue/:id ────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un item de la file' })
  @ApiParam({ name: 'id', description: 'UUID de l\'item' })
  @ApiResponse({ status: HttpStatus.OK, type: SyncQueueItemResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item introuvable' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SyncQueueItemResponseDto> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundException(`Item de sync "${id}" introuvable`);
    return toResponseDto(found);
  }
  // ── PATCH /sync-queue/:id/resolve ─────────────────────────
  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Résoudre manuellement un conflit de synchronisation',
    description:
      'Permet à un admin de choisir comment résoudre un item en statut CONFLICT : ' +
      'KEEP_LOCAL, KEEP_SERVER, ou MERGE (avec payload fusionné).',
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'item en conflit' })
  @ApiResponse({ status: HttpStatus.OK, type: SyncQueueItemResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item introuvable' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'L\'item n\'est pas en statut CONFLICT' })
  async resolveConflict(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSyncConflictDto,
  ): Promise<SyncQueueItemResponseDto> {
    return this.resolveConflictUseCase.execute(id, dto);
  }
}
