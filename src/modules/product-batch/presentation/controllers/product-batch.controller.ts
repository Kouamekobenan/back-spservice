import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CreateProductBatchDto } from '../../application/dtos/create-batch.dto.js';
import { UpdateProductBatchDto } from '../../application/dtos/update-batch.dto.js';
import { ProductBatchResponseDto } from '../../application/dtos/product-batch-response.dto.js';
import { CreateProductBatchUseCase } from '../../application/usecases/create-batch.usecase.js';
import { GetBatchesByProductUseCase } from '../../application/usecases/get-batches-by-product.usecase.js';
import { UpdateBatchQuantityUseCase } from '../../application/usecases/update-batch-quantity.usecase.js';
import { GetExpiringBatchesUseCase } from '../../application/usecases/get-expiring-batches.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('product-batches')
@ApiBearerAuth()
@Controller('product-batches')
export class ProductBatchController {
  private readonly logger = new Logger(ProductBatchController.name);

  constructor(
    private readonly createBatchUseCase: CreateProductBatchUseCase,
    private readonly getByProductUseCase: GetBatchesByProductUseCase,
    private readonly updateBatchUseCase: UpdateBatchQuantityUseCase,
    private readonly getExpiringUseCase: GetExpiringBatchesUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un nouveau lot (arrivage)' })
  @ApiCreatedResponse({ type: ProductBatchResponseDto })
  async create(@Body() dto: CreateProductBatchDto): Promise<ProductBatchResponseDto> {
    this.logger.log(`Création d'un lot pour le produit: ${dto.productId}`);
    return await this.createBatchUseCase.execute(dto);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Récupérer tous les lots d\'un produit' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiOkResponse({ type: [ProductBatchResponseDto] })
  async getByProduct(@Param('productId') productId: string): Promise<ProductBatchResponseDto[]> {
    this.logger.log(`Récupération des lots pour le produit: ${productId}`);
    return await this.getByProductUseCase.execute(productId);
  }

  @Public()
  @Get('expiring/:shopId')
  @ApiOperation({ summary: 'Récupérer les lots arrivant à expiration' })
  @ApiParam({ name: 'shopId', description: 'ID de la boutique' })

  async getExpiring(
    @Param('shopId') shopId: string,
    @Query('days') days: number = 30,
  ): Promise<ProductBatchResponseDto[]> {
    this.logger.log(`Récupération des lots expirant sous ${days} jours pour la boutique ${shopId}`);
    return await this.getExpiringUseCase.execute(shopId, Number(days));
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un lot (quantité, prix, etc.)' })
  @ApiParam({ name: 'id', description: 'ID du lot' })
  @ApiOkResponse({ type: ProductBatchResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductBatchDto,
  ): Promise<ProductBatchResponseDto> {
    this.logger.log(`Mise à jour du lot: ${id}`);
    return await this.updateBatchUseCase.execute(id, dto);
  }
}
