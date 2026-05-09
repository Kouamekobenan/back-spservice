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
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateSupplierDto } from '../../application/dtos/create-supplier-dto.dto.js';
import { UpdateSupplierDto } from '../../application/dtos/update-supplier-dto.dto.js';
import { SupplierQueryDto } from '../../application/dtos/supplier-query.dto.js';
import { SupplierResponseDto } from '../../application/dtos/supplier-response.dto.js';
import { CreateSupplierUseCase } from '../../application/usecases/create-supplier.usecase.js';
import { GetAllSuppliersUseCase } from '../../application/usecases/get-all-suppliers.usecase.js';
import { GetSupplierByIdUseCase } from '../../application/usecases/get-supplier-by-id.usecase.js';
import { UpdateSupplierUseCase } from '../../application/usecases/update-supplier.usecase.js';
import { DeleteSupplierUseCase } from '../../application/usecases/delete-supplier.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SupplierController {
  private readonly logger = new Logger(SupplierController.name);

  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly getAllSuppliersUseCase: GetAllSuppliersUseCase,
    private readonly getSupplierByIdUseCase: GetSupplierByIdUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly deleteSupplierUseCase: DeleteSupplierUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  async create(@Body() createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(`Création d'un fournisseur: ${createSupplierDto.name}`);
    return await this.createSupplierUseCase.execute(createSupplierDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les fournisseurs avec pagination' })
  @ApiOkResponse({ type: [SupplierResponseDto] })
  async findAll(@Query() query: SupplierQueryDto) {
    this.logger.log('Récupération des fournisseurs paginés');
    return await this.getAllSuppliersUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fournisseur par ID' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiOkResponse({ type: SupplierResponseDto })
  async findOne(@Param('id') id: string): Promise<SupplierResponseDto> {
    this.logger.log(`Récupération du fournisseur: ${id}`);
    return await this.getSupplierByIdUseCase.execute(id);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiOkResponse({ type: SupplierResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    this.logger.log(`Mise à jour du fournisseur: ${id}`);
    return await this.updateSupplierUseCase.execute(id, updateSupplierDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  @ApiOkResponse({ description: 'Fournisseur supprimé avec succès' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Suppression du fournisseur: ${id}`);
    await this.deleteSupplierUseCase.execute(id);
    return { success: true, message: 'Fournisseur supprimé avec succès' };
  }
}
