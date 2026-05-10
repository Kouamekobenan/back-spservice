import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { UpdateExpenseDto } from '../dtos/update-expense.dto.js';
import { Expense } from '../../domain/entities/expense.entity.js';

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new NotFoundException(`Dépense ${id} non trouvée.`);
    return await this.expenseRepository.update(id, data);
  }
}
