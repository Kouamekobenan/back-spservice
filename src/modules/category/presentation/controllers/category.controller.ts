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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateCategoryDto } from '../../application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '../../application/dtos/update-category.dto.js';
import { CategoryQueryDto } from '../../application/dtos/category-query.dto.js';
import { CategoryResponseDto } from '../../application/dtos/category-response.dto.js';
import { CreateCategoryUseCase } from '../../application/usecases/create-category.usecase.js';
import { GetAllCategoriesUseCase } from '../../application/usecases/get-all-categories.usecase.js';
import { GetCategoryByIdUseCase } from '../../application/usecases/get-category-by-id.usecase.js';
import { UpdateCategoryUseCase } from '../../application/usecases/update-category.usecase.js';
import { DeleteCategoryUseCase } from '../../application/usecases/delete-category.usecase.js';
import { GetSubcategoriesUseCase } from '../../application/usecases/get-subcategories.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly getSubcategoriesUseCase: GetSubcategoriesUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle catégorie' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiCreatedResponse({ type: CategoryResponseDto })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    this.logger.log(`Création d'une catégorie: ${createCategoryDto.name}`);
    return await this.createCategoryUseCase.execute(createCategoryDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les catégories avec pagination' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
    @UsePipes(new ValidationPipe({ transform: true }))
  
  async findAll(@Query() query: CategoryQueryDto) {
    this.logger.log('Récupération des catégories paginées');
    return await this.getAllCategoriesUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une catégorie par ID' })
  @ApiParam({ name: 'id', description: 'UUID de la catégorie' })
  @ApiOkResponse({ type: CategoryResponseDto })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    this.logger.log(`Récupération de la catégorie: ${id}`);
    return await this.getCategoryByIdUseCase.execute(id);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiParam({ name: 'id', description: 'UUID de la catégorie' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOkResponse({ type: CategoryResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Mise à jour de la catégorie: ${id}`);
    return await this.updateCategoryUseCase.execute(id, updateCategoryDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiParam({ name: 'id', description: 'UUID de la catégorie' })
  @ApiOkResponse({ description: 'Catégorie supprimée avec succès' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Suppression de la catégorie: ${id}`);
    await this.deleteCategoryUseCase.execute(id);
    return { success: true, message: 'Catégorie supprimée avec succès' };
  }

  @Public()
  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Récupérer les sous-catégories d\'une catégorie' })
  @ApiParam({ name: 'id', description: 'UUID de la catégorie parente' })
  @ApiOkResponse({ type: [CategoryResponseDto] })
  async getSubcategories(@Param('id') id: string): Promise<CategoryResponseDto[]> {
    this.logger.log(`Récupération des sous-catégories pour: ${id}`);
    return await this.getSubcategoriesUseCase.execute(id);
  }
}
