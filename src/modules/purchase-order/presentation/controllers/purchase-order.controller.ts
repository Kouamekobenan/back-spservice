import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Logger,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
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
import { CreatePurchaseOrderUseCase } from '../../application/usecases/create-purchase-order.usecase.js';
import { GetAllPurchaseOrdersUseCase } from '../../application/usecases/get-all-purchase-orders.usecase.js';
import { GetPurchaseOrderByIdUseCase } from '../../application/usecases/get-purchase-order-by-id.usecase.js';
import { UpdatePurchaseOrderStatusUseCase } from '../../application/usecases/update-purchase-order-status.usecase.js';
import { ReceivePurchaseOrderUseCase } from '../../application/usecases/receive-purchase-order.usecase.js';
import { CreatePurchaseOrderDto } from '../../application/dtos/create-purchase-order.dto.js';
import { PurchaseOrderQueryDto } from '../../application/dtos/purchase-order-query.dto.js';
import { PurchaseOrderResponseDto } from '../../application/dtos/purchase-order-response.dto.js';
import { UpdatePurchaseOrderStatusDto } from '../../application/dtos/update-purchase-order.dto.js';
import { ReceiveItemsDto } from '../../application/dtos/receive-items.dto.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('PurchaseOrders')
@ApiBearerAuth()
@Controller('purchase-orders')  
export class PurchaseOrderController {
  constructor(
    private readonly createUseCase: CreatePurchaseOrderUseCase,
    private readonly findAllUseCase: GetAllPurchaseOrdersUseCase,
    private readonly findByIdUseCase: GetPurchaseOrderByIdUseCase,
    private readonly updateStatusUseCase: UpdatePurchaseOrderStatusUseCase,
    private readonly receiveUseCase: ReceivePurchaseOrderUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau bon de commande' })
  @ApiCreatedResponse({ type: PurchaseOrderResponseDto })
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return await this.createUseCase.execute(dto);
  }
  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister tous les bons de commande' })
  @ApiOkResponse({ type: [PurchaseOrderResponseDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: PurchaseOrderQueryDto) {
    return await this.findAllUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un bon de commande par ID' })
  @ApiParam({ name: 'id', description: 'UUID du bon de commande' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async findOne(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }

  @Public()
  @Put(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’un bon de commande' })
  @ApiParam({ name: 'id', description: 'UUID du bon de commande' })
  @ApiBody({ type: UpdatePurchaseOrderStatusDto })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return await this.updateStatusUseCase.execute(id, dto.status);
  }

  @Public()
  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer la réception d’articles' })
  @ApiParam({ name: 'id', description: 'UUID du bon de commande' })
  @ApiBody({ type: ReceiveItemsDto })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async receiveItems(@Param('id') id: string, @Body() dto: ReceiveItemsDto) {
    return await this.receiveUseCase.execute(id, dto, dto.userId);
  }
}
