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
  ApiBody,
} from '@nestjs/swagger';
import { CreateProductDto } from '../../application/dtos/create-product.dto.js';
import { UpdateProductDto } from '../../application/dtos/update-product.dto.js';
import { ProductQueryDto } from '../../application/dtos/product-query.dto.js';
import { ProductResponseDto } from '../../application/dtos/product-response.dto.js';
import { CreateProductUseCase } from '../../application/usecases/create-product.usecase.js';
import { GetAllProductsUseCase } from '../../application/usecases/get-all-products.usecase.js';
import { GetProductByIdUseCase } from '../../application/usecases/get-product-by-id.usecase.js';
import { UpdateProductUseCase } from '../../application/usecases/update-product.usecase.js';
import { DeleteProductUseCase } from '../../application/usecases/delete-product.usecase.js';
import { GetStockAlertsUseCase } from '../../application/usecases/get-stock-alerts.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getAllProductsUseCase: GetAllProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getStockAlertsUseCase: GetStockAlertsUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    this.logger.log(`Création d'un produit: ${createProductDto.name}`);
    return await this.createProductUseCase.execute(createProductDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les produits avec filtres avancés' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  async findAll(@Query() query: ProductQueryDto) {
    this.logger.log('Récupération des produits paginés');
    return await this.getAllProductsUseCase.execute(query);
  }

  @Public()
  @Get('alerts/:shopId')
  @ApiOperation({ summary: 'Récupérer les alertes de stock pour une boutique' })
  @ApiParam({ name: 'shopId', description: 'ID de la boutique' })
  @ApiOkResponse({ type: [ProductResponseDto] })
  async getAlerts(@Param('shopId') shopId: string): Promise<ProductResponseDto[]> {
    this.logger.log(`Récupération des alertes de stock pour la boutique: ${shopId}`);
    return await this.getStockAlertsUseCase.execute(shopId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un produit par ID' })
  @ApiParam({ name: 'id', description: 'UUID du produit' })
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.log(`Récupération du produit: ${id}`);
    return await this.getProductByIdUseCase.execute(id);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiParam({ name: 'id', description: 'UUID du produit' })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ type: ProductResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    this.logger.log(`Mise à jour du produit: ${id}`);
    return await this.updateProductUseCase.execute(id, updateProductDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'UUID du produit' })
  @ApiOkResponse({ description: 'Produit supprimé avec succès' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Suppression du produit: ${id}`);
    await this.deleteProductUseCase.execute(id);
    return { success: true, message: 'Produit supprimé avec succès' };
  }
}
