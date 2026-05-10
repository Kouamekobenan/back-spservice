import { Expense, ExpenseCategory } from '../entities/expense.entity.js';
import { CreateExpenseDto } from '../../application/dtos/create-expense.dto.js';
import { UpdateExpenseDto } from '../../application/dtos/update-expense.dto.js';

export interface IExpenseRepository {
  create(data: CreateExpenseDto): Promise<Expense>;
  update(id: string, data: UpdateExpenseDto): Promise<Expense>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Expense | null>;
  findAll(filters: { shopId?: string; category?: ExpenseCategory; startDate?: Date; endDate?: Date }): Promise<Expense[]>;
}
