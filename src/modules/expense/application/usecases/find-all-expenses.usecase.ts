import { Inject, Injectable } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { FilterExpenseDto } from '../dtos/filter-expense.dto.js';
import { Expense } from '../../domain/entities/expense.entity.js';

@Injectable()
export class FindAllExpensesUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(filters: FilterExpenseDto): Promise<Expense[]> {
    return await this.expenseRepository.findAll({
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });
  }
}
