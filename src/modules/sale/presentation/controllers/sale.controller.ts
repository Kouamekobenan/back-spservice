import {
  Controller, Post, Body, Get, Param,
  Query, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiQuery, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { CreateSaleUseCase }    from '../../application/usecases/create-sale.usecase.js';
import { FindSaleByIdUseCase }  from '../../application/usecases/find-sale-by-id.usecase.js';
import { FindAllSalesUseCase }  from '../../application/usecases/find-all-sales.usecase.js';
import { CreateSaleDto }        from '../../application/dtos/create-sale.dto.js';
import { FilterSaleDto }        from '../../application/dtos/filter-sale.dto.js';
import {
  SaleResponseDto,
  PaginatedSaleResponseDto,
  toSaleResponseDto,
} from '../../application/dtos/sale-response.dto.js';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SaleController {
  constructor(
    private readonly createUseCase:   CreateSaleUseCase,
    private readonly findByIdUseCase: FindSaleByIdUseCase,
    private readonly findAllUseCase:  FindAllSalesUseCase,
  ) {}

  // ── POST /sales ───────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer une nouvelle vente' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ status: 201, description: 'Vente enregistrée avec succès.', type: SaleResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides ou stock insuffisant.' })
  async create(@Body() dto: CreateSaleDto): Promise<SaleResponseDto> {
    const sale = await this.createUseCase.execute(dto);
    return toSaleResponseDto(sale);
  }

  // ── GET /sales ────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les ventes paginées d\'une boutique',
    description:
      'Retourne les ventes filtrées et paginées. ' +
      'Au moins `shopId` est recommandé. ' +
      'Utiliser `fromDate`/`toDate` pour filtrer par période.',
  })
  @ApiQuery({ name: 'shopId',        required: false, description: 'ID de la boutique' })
  @ApiQuery({ name: 'status',        required: false, description: 'COMPLETED | PARTIALLY_PAID | VOIDED | REFUNDED' })
  @ApiQuery({ name: 'userId',        required: false, description: 'Filtrer par caissier' })
  @ApiQuery({ name: 'customerId',    required: false, description: 'Filtrer par client' })
  @ApiQuery({ name: 'cashSessionId', required: false, description: 'Filtrer par session de caisse' })
  @ApiQuery({ name: 'search',        required: false, description: 'Recherche sur le numéro de reçu', example: 'SP-20260603' })
  @ApiQuery({ name: 'fromDate',      required: false, description: 'Date début ISO 8601', example: '2026-06-01T00:00:00.000Z' })
  @ApiQuery({ name: 'toDate',        required: false, description: 'Date fin ISO 8601',   example: '2026-06-30T23:59:59.999Z' })
  @ApiQuery({ name: 'page',          required: false, type: Number, description: 'Page (défaut: 1)' })
  @ApiQuery({ name: 'limit',         required: false, type: Number, description: 'Résultats par page, max 100 (défaut: 30)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des ventes.', type: PaginatedSaleResponseDto })
  async findAll(@Query() filters: FilterSaleDto): Promise<PaginatedSaleResponseDto> {
    return this.findAllUseCase.execute(filters);
  }

  // ── GET /sales/:id ────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les détails d\'une vente par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la vente' })
  @ApiResponse({ status: 200, description: 'Détails de la vente.', type: SaleResponseDto })
  @ApiResponse({ status: 404, description: 'Vente non trouvée.' })
  async findById(@Param('id') id: string): Promise<SaleResponseDto> {
    const sale = await this.findByIdUseCase.execute(id);
    if (!sale) throw new NotFoundException(`Vente ${id} non trouvée`);
    return toSaleResponseDto(sale);
  }
}
