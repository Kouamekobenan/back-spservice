import { Controller, Get, Query, Res, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ExportQueryDto, StockExportQueryDto } from '../../application/dtos/export-query.dto.js';
import {
  ProductsSummaryQueryDto,
  ProductsSummaryExportQueryDto,
  ProductsSummaryResponseDto,
} from '../../application/dtos/products-summary-query.dto.js';
import {
  ExportSalesUseCase,
  ExportFinancialUseCase,
  ExportStockUseCase,
  ExportDebtsUseCase,
} from '../../application/usecases/export-sales.usecase.js';
import { GetProductsSalesSummaryUseCase } from '../../application/usecases/get-products-sales-summary.usecase.js';
import { ExportProductsSalesSummaryUseCase } from '../../application/usecases/export-products-sales-summary.usecase.js';
import { ExportLossesUseCase } from '../../application/usecases/export-losses.usecase.js';

@ApiTags('Reports — Export')
@ApiBearerAuth()
@Controller('reports')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReportExportController {
  constructor(
    private readonly exportSales:           ExportSalesUseCase,
    private readonly exportFinancial:       ExportFinancialUseCase,
    private readonly exportStock:           ExportStockUseCase,
    private readonly exportDebts:           ExportDebtsUseCase,
    private readonly getProductsSummary:    GetProductsSalesSummaryUseCase,
    private readonly exportProductsSummary: ExportProductsSalesSummaryUseCase,
    private readonly exportLosses:          ExportLossesUseCase,
  ) {}

  // ── GET /reports/sales/export ────────────────────────────────────────

  @Get('sales/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport des ventes (PDF ou Excel)',
    description:
      'Génère un fichier téléchargeable avec la liste des ventes, les KPIs et la répartition par mode de paiement. ' +
      'Sans `fromDate`/`toDate`, le rapport porte sur la journée en cours.',
  })
  @ApiQuery({ name: 'shopId',   required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'format',   required: true,  enum: ['pdf', 'xlsx'], description: 'Format du fichier' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Date début ISO 8601' })
  @ApiQuery({ name: 'toDate',   required: false, description: 'Date fin ISO 8601' })
  @ApiQuery({ name: 'userId',   required: false, description: 'Filtrer par caissier' })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX en réponse binaire.' })
  async exportSalesReport(@Query() query: ExportQueryDto, @Res() res: any) {
    const result = await this.exportSales.execute(query);
    sendFile(res, result);
  }

  // ── GET /reports/financial/export ────────────────────────────────────

  @Get('financial/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport financier (Compte de résultat)',
    description:
      'CA, remises, COGS, marge brute, charges par catégorie, résultat net. ' +
      'Sans dates, le rapport couvre le mois en cours.',
  })
  @ApiQuery({ name: 'shopId',   required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'format',   required: true,  enum: ['pdf', 'xlsx'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate',   required: false })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX.' })
  async exportFinancialReport(@Query() query: ExportQueryDto, @Res() res: any) {
    const result = await this.exportFinancial.execute(query);
    sendFile(res, result);
  }

  // ── GET /reports/stock/export ─────────────────────────────────────────

  @Get('stock/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport de stock',
    description:
      'Liste tous les produits avec quantités, prix et valeur de stock. ' +
      'Utiliser `stockFilter=low` pour n\'avoir que les produits en alerte, `out` pour les ruptures.',
  })
  @ApiQuery({ name: 'shopId',      required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'format',      required: true,  enum: ['pdf', 'xlsx'] })
  @ApiQuery({ name: 'categoryId',  required: false, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'stockFilter', required: false, enum: ['all', 'low', 'out'], description: 'Filtre par statut stock' })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX.' })
  async exportStockReport(@Query() query: StockExportQueryDto, @Res() res: any) {
    const result = await this.exportStock.execute(query);
    sendFile(res, result);
  }

  // ── GET /reports/debts/export ─────────────────────────────────────────

  @Get('debts/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport des créances clients',
    description: 'Liste tous les clients avec une dette > 0, leur plafond et si le plafond est dépassé.',
  })
  @ApiQuery({ name: 'shopId', required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'format', required: true,  enum: ['pdf', 'xlsx'] })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX.' })
  async exportDebtsReport(
    @Query('shopId') shopId: string,
    @Query('format') format: 'pdf' | 'xlsx',
    @Res() res: any,
  ) {
    const result = await this.exportDebts.execute({ shopId, format });
    sendFile(res, result);
  }

  // ── GET /reports/sales/products-summary ─────────────────────────────

  @Get('sales/products-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rapport récapitulatif des ventes par produit (JSON)',
    description:
      'Retourne la liste agrégée des produits vendus sur une période avec quantité totale vendue, CA, coût d\'achat (COGS), marge brute et taux de marge.',
  })
  @ApiResponse({ status: 200, type: ProductsSummaryResponseDto, description: 'Statistiques agrégées par produit' })
  async getProductsSalesSummary(@Query() query: ProductsSummaryQueryDto): Promise<ProductsSummaryResponseDto> {
    return await this.getProductsSummary.execute(query);
  }

  // ── GET /reports/sales/products-summary/export ──────────────────────

  @Get('sales/products-summary/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport récapitulatif des ventes par produit (PDF ou Excel)',
    description: 'Exporte l\'ensemble des produits vendus sur la période au format PDF ou Excel.',
  })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX.' })
  async exportProductsSalesSummary(@Query() query: ProductsSummaryExportQueryDto, @Res() res: any) {
    const result = await this.exportProductsSummary.execute(query);
    sendFile(res, result);
  }

  // ── GET /reports/losses ──────────────────────────────────────────────

  @Get('losses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rapport des pertes et démarques (JSON)',
    description:
      'Retourne la liste des articles mis au rebut ou déclarés perdus sur une période, groupés par motif de perte.',
  })
  @ApiQuery({ name: 'shopId',   required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Date de début ISO 8601' })
  @ApiQuery({ name: 'toDate',   required: false, description: 'Date de fin ISO 8601' })
  @ApiResponse({ status: 200, description: 'Données détaillées des pertes et démarques.' })
  async getLossesReport(
    @Query('shopId') shopId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return await this.exportLosses.getData(shopId, fromDate, toDate);
  }

  // ── GET /reports/losses/export ───────────────────────────────────────

  @Get('losses/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter le rapport des pertes et démarques (PDF ou Excel)',
    description: 'Génère un fichier téléchargeable PDF ou Excel récapitulant les pertes de stock.',
  })
  @ApiQuery({ name: 'shopId',   required: true,  description: 'ID de la boutique' })
  @ApiQuery({ name: 'format',   required: true,  enum: ['pdf', 'xlsx'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate',   required: false })
  @ApiResponse({ status: 200, description: 'Fichier PDF ou XLSX.' })
  async exportLossesReport(@Query() query: ExportQueryDto, @Res() res: any) {
    const result = await this.exportLosses.execute(query);
    sendFile(res, result);
  }
}

// ── Helper pour envoyer le fichier binaire ───────────────────────────────────

function sendFile(res: any, result: { buffer: Buffer; filename: string; contentType: string }) {
  res.set({
    'Content-Type':        result.contentType,
    'Content-Disposition': `attachment; filename="${result.filename}"`,
    'Content-Length':      result.buffer.length,
    'Cache-Control':       'no-store',
  });
  res.end(result.buffer);
}
