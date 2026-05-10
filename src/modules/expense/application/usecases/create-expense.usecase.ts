import { Inject, Injectable } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { CreateExpenseDto } from '../dtos/create-expense.dto.js';
import { Expense } from '../../domain/entities/expense.entity.js';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(data: CreateExpenseDto): Promise<Expense> {
    return await this.expenseRepository.create(data);
  }
}
