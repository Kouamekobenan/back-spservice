import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator.js';
import { InventoryQueryDto } from '../../application/dtos/inventory-query.dto.js';
import {
  InventoryOverviewResponseDto,
  TopProductsResponseDto,
  StockValuationResponseDto,
  InventoryAlertsResponseDto,
} from '../../application/dtos/inventory-response.dto.js';
import { GetInventoryOverviewUseCase } from '../../application/usecases/get-inventory-overview.usecase.js';
import { GetTopProductsUseCase } from '../../application/usecases/get-top-products.usecase.js';
import { GetStockValuationUseCase } from '../../application/usecases/get-stock-valuation.usecase.js';
import { GetInventoryAlertsUseCase } from '../../application/usecases/get-inventory-alerts.usecase.js';

@ApiTags('inventory-dashboard')
@ApiBearerAuth()
@Controller('inventory-dashboard')
export class InventoryDashboardController {
  private readonly logger = new Logger(InventoryDashboardController.name);

  constructor(
    private readonly overviewUseCase: GetInventoryOverviewUseCase,
    private readonly topProductsUseCase: GetTopProductsUseCase,
    private readonly valuationUseCase: GetStockValuationUseCase,
    private readonly alertsUseCase: GetInventoryAlertsUseCase,
  ) {}

  @Public()
  @Get('overview/:shopId')
  @ApiOperation({
    summary: 'Vue synthèse inventaire',
    description:
      'Valeur du stock au prix d\'achat, CA potentiel, bénéfice potentiel, ' +
      'résumé des ventes (CA réalisé, bénéfice brut, transactions) et alertes stock pour la période.',
  })
  @ApiParam({ name: 'shopId', description: 'UUID de la boutique' })
  @ApiOkResponse({ type: InventoryOverviewResponseDto })
  async getOverview(
    @Param('shopId') shopId: string,
    @Query() query: InventoryQueryDto,
  ): Promise<InventoryOverviewResponseDto> {
    this.logger.log(`Inventory overview — shop: ${shopId}, period: ${query.period}`);
    return this.overviewUseCase.execute(shopId, query);
  }

  @Public()
  @Get('products/:shopId')
  @ApiOperation({
    summary: 'Top produits vendus + produits dormants',
    description:
      'Classement des produits par unités vendues avec marge, bénéfice brut et couverture de stock. ' +
      'Liste aussi les produits avec stock immobilisé non vendus sur la période.',
  })
  @ApiParam({ name: 'shopId', description: 'UUID de la boutique' })
  @ApiOkResponse({ type: TopProductsResponseDto })
  async getTopProducts(
    @Param('shopId') shopId: string,
    @Query() query: InventoryQueryDto,
  ): Promise<TopProductsResponseDto> {
    this.logger.log(`Top products — shop: ${shopId}, period: ${query.period}`);
    return this.topProductsUseCase.execute(shopId, query);
  }

  @Public()
  @Get('valuation/:shopId')
  @ApiOperation({
    summary: 'Valorisation du stock par catégorie',
    description:
      'Valeur totale du stock ventilée par catégorie : prix d\'achat, CA potentiel, ' +
      'bénéfice potentiel et part de chaque catégorie dans la valeur totale.',
  })
  @ApiParam({ name: 'shopId', description: 'UUID de la boutique' })
  @ApiOkResponse({ type: StockValuationResponseDto })
  async getValuation(
    @Param('shopId') shopId: string,
  ): Promise<StockValuationResponseDto> {
    this.logger.log(`Stock valuation — shop: ${shopId}`);
    return this.valuationUseCase.execute(shopId);
  }

  @Public()
  @Get('alerts/:shopId')
  @ApiOperation({
    summary: 'Alertes inventaire',
    description:
      'Trois niveaux d\'alertes : ruptures totales (stock = 0), stock bas (0 < qty ≤ minQty) ' +
      'et produits dormants (stock > 0 mais aucune vente sur la période).',
  })
  @ApiParam({ name: 'shopId', description: 'UUID de la boutique' })
  @ApiOkResponse({ type: InventoryAlertsResponseDto })
  async getAlerts(
    @Param('shopId') shopId: string,
    @Query() query: InventoryQueryDto,
  ): Promise<InventoryAlertsResponseDto> {
    this.logger.log(`Inventory alerts — shop: ${shopId}, period: ${query.period}`);
    return this.alertsUseCase.execute(shopId, query);
  }
}
