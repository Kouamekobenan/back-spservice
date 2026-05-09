import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../application/usecases/create-customer.usecase.js';
import { FindAllCustomersUseCase } from '../../application/usecases/find-all-customers.usecase.js';
import { FindCustomerByIdUseCase } from '../../application/usecases/find-customer-by-id.usecase.js';
import { UpdateCustomerUseCase } from '../../application/usecases/update-customer.usecase.js';
import { DeleteCustomerUseCase } from '../../application/usecases/delete-customer.usecase.js';
import { PaginateCustomerUseCase } from '../../application/usecases/paginate-customer.usecase.js';
import { CreateCustomerDto } from '../../application/dtos/create-customer.dto.js';
import { UpdateCustomerDto } from '../../application/dtos/update-customer.dto.js';
import { PaginateCustomerQueryDto } from '../../application/dtos/paginate-customer-query.dto.js';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly findAllCustomersUseCase: FindAllCustomersUseCase,
    private readonly findCustomerByIdUseCase: FindCustomerByIdUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly paginateCustomerUseCase: PaginateCustomerUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau client' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Client créé avec succès.' })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return await this.createCustomerUseCase.execute(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les clients' })
  async findAll() {
    return await this.findAllCustomersUseCase.execute();
  }

  @Get('paginate')
  @ApiOperation({ summary: 'Paginer les clients' })
  async paginate(@Query() query: PaginateCustomerQueryDto) {
    return await this.paginateCustomerUseCase.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un client par son ID' })
  async findOne(@Param('id') id: string) {
    return await this.findCustomerByIdUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un client' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return await this.updateCustomerUseCase.execute(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  async remove(@Param('id') id: string) {
    return await this.deleteCustomerUseCase.execute(id);
  }
}
