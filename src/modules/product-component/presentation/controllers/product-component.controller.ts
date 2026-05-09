import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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
import { AddProductComponentDto } from '../../application/dtos/add-component.dto.js';
import { UpdateProductComponentQtyDto } from '../../application/dtos/update-component-qty.dto.js';
import { ProductComponentResponseDto } from '../../application/dtos/product-component-response.dto.js';
import { AddComponentToKitUseCase } from '../../application/usecases/add-component-to-kit.usecase.js';
import { RemoveComponentFromKitUseCase } from '../../application/usecases/remove-component-from-kit.usecase.js';
import { GetKitCompositionUseCase } from '../../application/usecases/get-kit-composition.usecase.js';
import { UpdateComponentQuantityUseCase } from '../../application/usecases/update-component-quantity.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('product-components')
@ApiBearerAuth()
@Controller('product-components')
export class ProductComponentController {
  private readonly logger = new Logger(ProductComponentController.name);

  constructor(
    private readonly addComponentUseCase: AddComponentToKitUseCase,
    private readonly removeComponentUseCase: RemoveComponentFromKitUseCase,
    private readonly getKitUseCase: GetKitCompositionUseCase,
    private readonly updateQtyUseCase: UpdateComponentQuantityUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un produit comme composant d\'un kit' })
  @ApiCreatedResponse({ type: ProductComponentResponseDto })
  async add(@Body() dto: AddProductComponentDto): Promise<ProductComponentResponseDto> {
    this.logger.log(`Ajout du composant ${dto.componentId} au kit ${dto.composedId}`);
    return await this.addComponentUseCase.execute(dto);
  }

  @Public()
  @Get('kit/:kitId')
  @ApiOperation({ summary: 'Récupérer la composition complète d\'un kit' })
  @ApiParam({ name: 'kitId', description: 'ID du produit composé (le kit)' })
  @ApiOkResponse({ type: [ProductComponentResponseDto] })
  async getByKit(@Param('kitId') kitId: string): Promise<ProductComponentResponseDto[]> {
    this.logger.log(`Récupération de la composition pour le kit: ${kitId}`);
    return await this.getKitUseCase.execute(kitId);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Modifier la quantité d\'un composant dans un kit' })
  @ApiParam({ name: 'id', description: 'ID de la relation ProductComponent' })
  @ApiOkResponse({ type: ProductComponentResponseDto })
  async updateQty(
    @Param('id') id: string,
    @Body() dto: UpdateProductComponentQtyDto,
  ): Promise<ProductComponentResponseDto> {
    this.logger.log(`Mise à jour de la quantité pour le lien: ${id}`);
    return await this.updateQtyUseCase.execute(id, dto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Retirer un composant d\'un kit' })
  @ApiParam({ name: 'id', description: 'ID de la relation ProductComponent' })
  @ApiOkResponse({ description: 'Composant retiré avec succès' })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Retrait du composant lié via: ${id}`);
    await this.removeComponentUseCase.execute(id);
    return { success: true, message: 'Composant retiré du kit avec succès' };
  }
}
