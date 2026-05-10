import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateExpenseUseCase } from '../application/usecases/create-expense.usecase.js';
import { UpdateExpenseUseCase } from '../application/usecases/update-expense.usecase.js';
import { DeleteExpenseUseCase } from '../application/usecases/delete-expense.usecase.js';
import { FindAllExpensesUseCase } from '../application/usecases/find-all-expenses.usecase.js';
import { FindExpenseByIdUseCase } from '../application/usecases/find-expense-by-id.usecase.js';
import { CreateExpenseDto } from '../application/dtos/create-expense.dto.js';
import { UpdateExpenseDto } from '../application/dtos/update-expense.dto.js';
import { FilterExpenseDto } from '../application/dtos/filter-expense.dto.js';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly createUseCase: CreateExpenseUseCase,
    private readonly updateUseCase: UpdateExpenseUseCase,
    private readonly deleteUseCase: DeleteExpenseUseCase,
    private readonly findAllUseCase: FindAllExpensesUseCase,
    private readonly findByIdUseCase: FindExpenseByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer une nouvelle dépense' })
  @ApiResponse({ status: 201, description: 'Dépense créée avec succès.' })
  async create(@Body() data: CreateExpenseDto) {
    return await this.createUseCase.execute(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les dépenses avec filtres' })
  async findAll(@Query() filters: FilterExpenseDto) {
    return await this.findAllUseCase.execute(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une dépense par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la dépense' })
  async findById(@Param('id') id: string) {
    return await this.findByIdUseCase.execute(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une dépense existante' })
  @ApiParam({ name: 'id', description: 'UUID de la dépense' })
  async update(@Param('id') id: string, @Body() data: UpdateExpenseDto) {
    return await this.updateUseCase.execute(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une dépense' })
  @ApiParam({ name: 'id', description: 'UUID de la dépense' })
  async delete(@Param('id') id: string) {
    return await this.deleteUseCase.execute(id);
  }
}
