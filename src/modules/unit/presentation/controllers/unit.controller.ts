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
import { CreateUnitDto } from '../../application/dtos/create-unit.dto.js';
import { UpdateUnitDto } from '../../application/dtos/update-unit.dto.js';
import { UnitQueryDto } from '../../application/dtos/unit-query.dto.js';
import { UnitResponseDto } from '../../application/dtos/unit-response.dto.js';
import { CreateUnitUseCase } from '../../application/usecases/create-unit.usecase.js';
import { GetAllUnitsUseCase } from '../../application/usecases/get-all-units.usecase.js';
import { GetUnitByIdUseCase } from '../../application/usecases/get-unit-by-id.usecase.js';
import { UpdateUnitUseCase } from '../../application/usecases/update-unit.usecase.js';
import { DeleteUnitUseCase } from '../../application/usecases/delete-unit.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('units')
@ApiBearerAuth()
@Controller('units')
export class UnitController {
  private readonly logger = new Logger(UnitController.name);

  constructor(
    private readonly createUnitUseCase: CreateUnitUseCase,
    private readonly getAllUnitsUseCase: GetAllUnitsUseCase,
    private readonly getUnitByIdUseCase: GetUnitByIdUseCase,
    private readonly updateUnitUseCase: UpdateUnitUseCase,
    private readonly deleteUnitUseCase: DeleteUnitUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Créer une nouvelle unité de mesure',
    description: 'Permet de définir une nouvelle unité (ex: Kg, Litre, Pièce) utilisable pour les produits.'
  })
  @ApiBody({ type: CreateUnitDto })
  @ApiCreatedResponse({ 
    description: 'L\'unité a été créée avec succès.',
    type: UnitResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 409, description: 'Une unité avec ce nom existe déjà.' })
  async create(@Body() createUnitDto: CreateUnitDto): Promise<UnitResponseDto> {
    this.logger.log(`Création d'une unité: ${createUnitDto.name}`);
    return await this.createUnitUseCase.execute(createUnitDto);
  }

  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Récupérer toutes les unités',
    description: 'Retourne une liste paginée de toutes les unités de mesure enregistrées.'
  })
  @ApiOkResponse({ 
    description: 'Liste des unités récupérée avec succès.',
    type: [UnitResponseDto] 
  })
  async findAll(@Query() query: UnitQueryDto) {
    this.logger.log('Récupération des unités paginées');
    return await this.getAllUnitsUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une unité par son ID',
    description: 'Retourne les détails d\'une unité spécifique via son UUID.'
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'unité' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiResponse({ status: 404, description: 'Unité non trouvée.' })
  async findOne(@Param('id') id: string): Promise<UnitResponseDto> {
    this.logger.log(`Récupération de l'unité: ${id}`);
    return await this.getUnitByIdUseCase.execute(id);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour une unité',
    description: 'Permet de modifier le nom ou l\'abréviation d\'une unité existante.'
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'unité à modifier' })
  @ApiBody({ type: UpdateUnitDto })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiResponse({ status: 404, description: 'Unité non trouvée.' })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    this.logger.log(`Mise à jour de l'unité: ${id}`);
    return await this.updateUnitUseCase.execute(id, updateUnitDto);
  }
  @Public()
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une unité',
    description: 'Supprime définitivement une unité de mesure du système.'
  })
  @ApiParam({ name: 'id', description: 'UUID de l\'unité à supprimer' })
  @ApiOkResponse({ description: 'Unité supprimée avec succès.' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée.' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Suppression de l'unité: ${id}`);
    await this.deleteUnitUseCase.execute(id);
    return { success: true, message: 'Unité supprimée avec succès' };
  }
}
