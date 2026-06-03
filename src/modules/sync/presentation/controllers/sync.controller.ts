import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { GetSnapshotUseCase } from '../../application/use-cases/get-snapshot.use-case.js';
import { GetPullChangesUseCase } from '../../application/use-cases/get-pull-changes.use-case.js';
import { SnapshotQueryDto, PullQueryDto, SnapshotResponseDto, PullResponseDto } from '../../application/dtos/sync.dto.js';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(
    private readonly getSnapshotUseCase: GetSnapshotUseCase,
    private readonly getPullChangesUseCase: GetPullChangesUseCase,
  ) {}

  // ── GET /sync/snapshot ────────────────────────────────────────

  @Get('snapshot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Snapshot initial — données complètes pour un nouveau terminal',
    description:
      'Retourne l\'état actuel de toutes les entités demandées. ' +
      'À appeler une seule fois lors de la première installation du terminal offline. ' +
      'Utiliser `entities` pour ne charger que les entités nécessaires.',
  })
  @ApiQuery({ name: 'shopId',   required: false, description: 'Filtrer par boutique' })
  @ApiQuery({ name: 'entities', required: false, description: 'ex: products,customers,categories', example: 'products,customers,categories,units' })
  @ApiQuery({ name: 'page',     required: false, type: Number, description: 'Page (défaut: 1)' })
  @ApiQuery({ name: 'limit',    required: false, type: Number, description: 'Taille de page, max 200 (défaut: 100)' })
  @ApiResponse({ status: 200, description: 'Snapshot retourné', type: SnapshotResponseDto })
  async getSnapshot(@Query() query: SnapshotQueryDto): Promise<SnapshotResponseDto> {
    return this.getSnapshotUseCase.execute(query);
  }

  // ── GET /sync/pull ────────────────────────────────────────────

  @Get('pull')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pull bidirectionnel — changements depuis un timestamp',
    description:
      'Retourne tous les changements survenus sur le serveur depuis `since`. ' +
      'Le client doit stocker le `serverTime` retourné et l\'utiliser comme prochain `since`. ' +
      'Limité à 90 jours en arrière (utiliser /snapshot pour une sync initiale).',
  })
  @ApiQuery({ name: 'since',       required: true,  description: 'Date ISO 8601', example: '2026-06-01T00:00:00.000Z' })
  @ApiQuery({ name: 'shopId',      required: false,  description: 'Filtrer par boutique' })
  @ApiQuery({ name: 'entityTypes', required: false,  description: 'ex: Sale,Product,Customer', example: 'Sale,Product' })
  @ApiQuery({ name: 'limit',       required: false,  type: Number, description: 'Max 1000 (défaut: 500)' })
  @ApiQuery({ name: 'offset',      required: false,  type: Number, description: 'Pagination offset (défaut: 0)' })
  @ApiResponse({ status: 200, description: 'Changements retournés', type: PullResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètre "since" invalide ou trop ancien' })
  async pull(@Query() query: PullQueryDto): Promise<PullResponseDto> {
    return this.getPullChangesUseCase.execute(query);
  }
}
