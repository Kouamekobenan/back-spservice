import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateStockTransferUseCase } from '../application/usecases/create-stock-transfer.usecase.js';
import { UpdateStockTransferStatusUseCase } from '../application/usecases/update-stock-transfer-status.usecase.js';
import { FindAllStockTransfersUseCase } from '../application/usecases/find-all-stock-transfers.usecase.js';
import { FindStockTransferByIdUseCase } from '../application/usecases/find-stock-transfer-by-id.usecase.js';
import { CreateStockTransferDto } from '../application/dtos/create-stock-transfer.dto.js';
import { UpdateStockTransferStatusDto } from '../application/dtos/update-stock-transfer-status.dto.js';
import { FilterStockTransferDto } from '../application/dtos/filter-stock-transfer.dto.js';

@ApiTags('Stock Transfers')
@Controller('stock-transfers')
export class StockTransferController {
  constructor(
    private readonly createUseCase: CreateStockTransferUseCase,
    private readonly updateStatusUseCase: UpdateStockTransferStatusUseCase,
    private readonly findAllUseCase: FindAllStockTransfersUseCase,
    private readonly findByIdUseCase: FindStockTransferByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau transfert de stock', description: 'Déclenche une sortie de stock (TRANSFER_OUT) dans la boutique source.' })
  @ApiResponse({ status: 201, description: 'Transfert créé avec succès.' })
  @ApiResponse({ status: 400, description: 'Données invalides ou stock insuffisant.' })
  async create(@Body() data: CreateStockTransferDto) {
    return await this.createUseCase.execute(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les transferts de stock', description: 'Permet de filtrer par boutique source, destination ou statut.' })
  async findAll(@Query() filters: FilterStockTransferDto) {
    return await this.findAllUseCase.execute(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un transfert par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du transfert' })
  async findById(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }

  @Put(':id/status')
  @ApiOperation({ 
    summary: 'Mettre à jour le statut d\'un transfert', 
    description: 'Passer à COMPLETED déclenche une entrée de stock (TRANSFER_IN) dans la boutique de destination. Passer à CANCELLED réintègre le stock dans la boutique source.' 
  })
  @ApiParam({ name: 'id', description: 'UUID du transfert' })
  async updateStatus(@Param('id') id: string, @Body() data: UpdateStockTransferStatusDto) {
    return await this.updateStatusUseCase.execute(id, data);
  }
}
