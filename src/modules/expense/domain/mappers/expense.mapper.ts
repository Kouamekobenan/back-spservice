import { Injectable } from '@nestjs/common';
import { Expense as PrismaExpense } from '@prisma/client';
import { Expense, ExpenseCategory } from '../entities/expense.entity.js';

@Injectable()
export class ExpenseMapper {
  toDomain(prismaExpense: PrismaExpense): Expense {
    return new Expense(
      prismaExpense.id,
      prismaExpense.title,
      prismaExpense.category as ExpenseCategory,
      Number(prismaExpense.amount),
      prismaExpense.date,
      prismaExpense.description,
      prismaExpense.receiptUrl,
      prismaExpense.isRecurring,
      prismaExpense.recurringDay,
      prismaExpense.shopId,
      prismaExpense.syncStatus,
      prismaExpense.localId,
      prismaExpense.createdAt,
      prismaExpense.updatedAt,
    );
  }
}
