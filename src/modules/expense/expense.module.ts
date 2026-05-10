import { Module } from '@nestjs/common';
import { ExpenseController } from './presentation/expense.controller.js';
import { CreateExpenseUseCase } from './application/usecases/create-expense.usecase.js';
import { UpdateExpenseUseCase } from './application/usecases/update-expense.usecase.js';
import { DeleteExpenseUseCase } from './application/usecases/delete-expense.usecase.js';
import { FindAllExpensesUseCase } from './application/usecases/find-all-expenses.usecase.js';
import { FindExpenseByIdUseCase } from './application/usecases/find-expense-by-id.usecase.js';
import { ExpenseMapper } from './domain/mappers/expense.mapper.js';
import { PrismaExpenseRepository } from './infrastructure/repository/prisma-expense.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExpenseController],
  providers: [
    CreateExpenseUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,
    FindAllExpensesUseCase,
    FindExpenseByIdUseCase,
    ExpenseMapper,
    {
      provide: 'IExpenseRepository',
      useClass: PrismaExpenseRepository,
    },
  ],
  exports: [
    CreateExpenseUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,
    FindAllExpensesUseCase,
    FindExpenseByIdUseCase,
  ],
})
export class ExpenseModule {}
