import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateCreditPaymentUseCase } from '../../application/usecases/create-credit-payment.usecase.js';
import { FindPaymentsByCustomerUseCase } from '../../application/usecases/find-payments-by-customer.usecase.js';
import { FindPaymentByIdUseCase } from '../../application/usecases/find-payment-by-id.usecase.js';
import { PaginateCreditPaymentsUseCase } from '../../application/usecases/paginate-credit-payments.usecase.js';
import { CreateCreditPaymentDto } from '../../application/dtos/create-credit-payment.dto.js';
import { PaginateCreditPaymentQueryDto } from '../../application/dtos/paginate-credit-payment-query.dto.js';

@ApiTags('Credit Payments')
@Controller('credit-payments')
export class CreditPaymentController {
  constructor(
    private readonly createPaymentUseCase: CreateCreditPaymentUseCase,
    private readonly findByCustomerUseCase: FindPaymentsByCustomerUseCase,
    private readonly findByIdUseCase: FindPaymentByIdUseCase,
    private readonly paginateUseCase: PaginateCreditPaymentsUseCase,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Enregistrer un nouveau paiement (versement)',
    description: 'Cette route crée un versement pour un client et réduit automatiquement sa dette totale (totalDebt) de manière atomique.'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Paiement enregistré avec succès.',
    type: CreateCreditPaymentDto // On peut définir un Response DTO plus précis si besoin
  })
  async create(@Body() createDto: CreateCreditPaymentDto) {
    return await this.createPaymentUseCase.execute(createDto);
  }

  @Get('paginate')
  @ApiOperation({ summary: 'Paginer les paiements' })
  async paginate(@Query() query: PaginateCreditPaymentQueryDto) {
    return await this.paginateUseCase.execute(query);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Récupérer l\'historique des paiements d\'un client' })
  async findByCustomer(@Param('customerId') customerId: string) {
    return await this.findByCustomerUseCase.execute(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un paiement par son ID' })
  async findOne(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }
}
