import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new NotFoundException(`Dépense ${id} non trouvée.`);
    await this.expenseRepository.delete(id);
  }
}
