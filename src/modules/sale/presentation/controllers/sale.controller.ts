import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSaleUseCase } from '../../application/usecases/create-sale.usecase.js';
import { FindSaleByIdUseCase } from '../../application/usecases/find-sale-by-id.usecase.js';
import { FindAllSalesUseCase } from '../../application/usecases/find-all-sales.usecase.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SaleController {
  constructor(
    private readonly createUseCase: CreateSaleUseCase,
    private readonly findByIdUseCase: FindSaleByIdUseCase,
    private readonly findAllUseCase: FindAllSalesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer une nouvelle vente' })
  @ApiResponse({ status: 201, description: 'Vente enregistrée avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou stock insuffisant.' })
  async create(@Body() dto: CreateSaleDto) {
    return await this.createUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer les détails d’une vente par son ID' })
  @ApiResponse({ status: 200, description: 'Détails de la vente.' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée.' })
  async findById(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les ventes d’une boutique' })
  @ApiResponse({ status: 200, description: 'Liste des ventes.' })
  async findAll(@Query('shopId') shopId: string) {
    return await this.findAllUseCase.execute({ shopId });
  }
}
