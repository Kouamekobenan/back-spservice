import { Controller, Get, Post, Body, Param, Put, Query, Req, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateStockTransferUseCase } from '../application/usecases/create-stock-transfer.usecase.js';
import { UpdateStockTransferStatusUseCase } from '../application/usecases/update-stock-transfer-status.usecase.js';
import { FindAllStockTransfersUseCase } from '../application/usecases/find-all-stock-transfers.usecase.js';
import { FindStockTransferByIdUseCase } from '../application/usecases/find-stock-transfer-by-id.usecase.js';
import { CreateStockTransferDto } from '../application/dtos/create-stock-transfer.dto.js';
import { UpdateStockTransferStatusDto } from '../application/dtos/update-stock-transfer-status.dto.js';
import { FilterStockTransferDto } from '../application/dtos/filter-stock-transfer.dto.js';

@ApiTags('Stock Transfers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('stock-transfers')
export class StockTransferController {
  private readonly logger = new Logger(StockTransferController.name);

  constructor(
    private readonly createUseCase: CreateStockTransferUseCase,
    private readonly updateStatusUseCase: UpdateStockTransferStatusUseCase,
    private readonly findAllUseCase: FindAllStockTransfersUseCase,
    private readonly findByIdUseCase: FindStockTransferByIdUseCase,
  ) {}

  private extractUserId(req: any, dtoUserId?: string): string | undefined {
    if (dtoUserId) return dtoUserId;
    if (req?.user?.userId) return req.user.userId;
    if (req?.user?.id) return req.user.id;
    if (req?.user?.sub) return req.user.sub;

    // Décoder le token JWT si présent dans l'en-tête Authorization
    const authHeader = req?.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
          return payload?.sub || payload?.userId || payload?.id;
        }
      } catch (err) {
        // Ignorer l'erreur de décodage
      }
    }
    return undefined;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau transfert de stock',
    description: 'Vérifie les stocks source, l\'accès boutique et déclenche une sortie de stock (TRANSFER_OUT) dans la boutique source.',
  })
  @ApiResponse({ status: 201, description: 'Transfert créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides, boutiques inactives ou stock insuffisant.' })
  @ApiResponse({ status: 403, description: 'Droits insuffisants pour initier le transfert.' })
  async create(@Body() data: CreateStockTransferDto, @Req() req: any) {
    const userId = this.extractUserId(req, data.userId);
    this.logger.log(`Création d'un transfert de ${data.fromShopId} vers ${data.toShopId} par ${userId || 'anonyme'}`);
    return await this.createUseCase.execute({ ...data, userId });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister tous les transferts de stock', description: 'Permet de filtrer par boutique source, destination ou statut.' })
  async findAll(@Query() filters: FilterStockTransferDto) {
    return await this.findAllUseCase.execute(filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer un transfert par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du transfert' })
  async findById(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Mettre à jour le statut d\'un transfert', 
    description: 'Passer à COMPLETED déclenche une entrée de stock (TRANSFER_IN) dans la boutique de destination (réservé aux gestionnaires de destination). Passer à CANCELLED réintègre le stock dans la boutique source.' 
  })
  @ApiParam({ name: 'id', description: 'UUID du transfert' })
  @ApiResponse({ status: 200, description: 'Statut du transfert mis à jour avec succès.' })
  @ApiResponse({ status: 400, description: 'Transfert déjà traité ou statut invalide.' })
  @ApiResponse({ status: 403, description: 'Droits insuffisants pour modifier ce transfert.' })
  @ApiResponse({ status: 404, description: 'Transfert introuvable.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateStockTransferStatusDto,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req, data.userId);
    this.logger.log(`Mise à jour du statut du transfert ${id} vers ${data.status} par ${userId || 'anonyme'}`);
    return await this.updateStatusUseCase.execute(id, { ...data, userId });
  }
}
