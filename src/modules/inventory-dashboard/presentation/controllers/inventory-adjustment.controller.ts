import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AdjustDiscrepanciesDto,
  AdjustDiscrepanciesResponseDto,
} from '../../application/dtos/adjust-discrepancies.dto.js';
import {
  ExpiryAlertsQueryDto,
  ExpiryAlertsResponseDto,
} from '../../application/dtos/expiry-alerts.dto.js';
import {
  StockWriteOffDto,
  StockWriteOffResponseDto,
} from '../../application/dtos/stock-write-off.dto.js';
import { AdjustDiscrepanciesUseCase } from '../../application/usecases/adjust-discrepancies.usecase.js';
import { GetExpiryAlertsUseCase } from '../../application/usecases/get-expiry-alerts.usecase.js';
import { StockWriteOffUseCase } from '../../application/usecases/stock-write-off.usecase.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { StockMovementReason } from '@prisma/client';

@ApiTags('Inventory — Adjustments & Loss')
@ApiBearerAuth('access-token')
@Controller('inventory')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class InventoryAdjustmentController {
  constructor(
    private readonly adjustUseCase: AdjustDiscrepanciesUseCase,
    private readonly getExpiryAlertsUseCase: GetExpiryAlertsUseCase,
    private readonly stockWriteOffUseCase: StockWriteOffUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('adjust-discrepancies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ajuster les écarts d\'inventaire physique (régularisation de stock)',
    description:
      'Met à jour le stock des produits selon les quantités physiques réelles constatées, ' +
      'génère les mouvements de stock appropriés (ADJUSTMENT ou LOSS) et trace l\'opération dans l\'AuditLog.',
  })
  @ApiResponse({
    status: 200,
    type: AdjustDiscrepanciesResponseDto,
    description: 'Régularisation effectuée avec succès.',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou produit n\'appartenant pas à la boutique.',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé pour cette boutique.',
  })
  async adjustDiscrepancies(
    @Body() dto: AdjustDiscrepanciesDto,
    @Req() req: any,
  ): Promise<AdjustDiscrepanciesResponseDto> {
    const userId = dto.userId || req?.user?.userId || req?.user?.id;
    return await this.adjustUseCase.execute({
      ...dto,
      userId,
    });
  }

  @Get('adjustments/history/:shopId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historique des ajustements d\'inventaire et pertes',
    description:
      'Retourne la liste des mouvements de stock de type ADJUSTMENT et LOSS pour une boutique.',
  })
  @ApiParam({ name: 'shopId', description: 'ID de la boutique' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getAdjustmentsHistory(
    @Param('shopId') shopId: string,
    @Query('limit') limit?: number,
  ) {
    const take = Math.min(100, Math.max(1, limit ? Number(limit) : 50));
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        shopId,
        reason: { in: [StockMovementReason.ADJUSTMENT, StockMovementReason.LOSS] },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            buyingPrice: true,
            sellingPrice: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return {
      shopId,
      count: movements.length,
      movements: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product.name,
        sku: m.product.sku,
        barcode: m.product.barcode,
        reason: m.reason,
        quantity: Number(m.quantity),
        stockBefore: Number(m.stockBefore),
        stockAfter: Number(m.stockAfter),
        discrepancy: Number(m.stockAfter) - Number(m.stockBefore),
        unitCost: m.unitCost ? Number(m.unitCost) : Number(m.product.buyingPrice),
        notes: m.notes,
        user: m.user ? { id: m.user.id, name: m.user.name, username: m.user.username } : null,
        createdAt: m.createdAt,
      })),
    };
  }

  @Post('write-off')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Déclasser des articles / déclarer une perte de stock (Mise au rebut)',
    description:
      'Décrémente le stock pour cause d\'expiration, casse, avarie ou vol, ' +
      'génère les mouvements de perte (LOSS) avec coût d\'achat et trace dans l\'AuditLog.',
  })
  @ApiResponse({
    status: 200,
    type: StockWriteOffResponseDto,
    description: 'Mise au rebut enregistrée avec succès.',
  })
  async writeOff(
    @Body() dto: StockWriteOffDto,
    @Req() req: any,
  ): Promise<StockWriteOffResponseDto> {
    const userId = dto.userId || req?.user?.userId || req?.user?.id;
    return await this.stockWriteOffUseCase.execute({
      ...dto,
      userId,
    });
  }

  @Get('expiry-alerts/:shopId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alertes de péremption et valorisation des pertes de la boutique',
    description:
      'Retourne la liste des produits déjà périmés et des produits arrivant à expiration sous X jours (défaut 30 jours), ' +
      'avec la valorisation financière des pertes avérées et potentielles.',
  })
  @ApiParam({ name: 'shopId', description: 'ID de la boutique' })
  @ApiResponse({
    status: 200,
    type: ExpiryAlertsResponseDto,
    description: 'Alertes de péremption calculées.',
  })
  async getExpiryAlerts(
    @Param('shopId') shopId: string,
    @Query() query: ExpiryAlertsQueryDto,
  ): Promise<ExpiryAlertsResponseDto> {
    return await this.getExpiryAlertsUseCase.execute(shopId, query);
  }
}

