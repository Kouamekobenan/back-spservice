import { Inject, Injectable } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { CreateExpenseDto } from '../dtos/create-expense.dto.js';
import { Expense } from '../../domain/entities/expense.entity.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async execute(data: CreateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.create(data);
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.CREATE,
        'Expense',
        expense.id,
        data.userId,
        expense.shopId,
        undefined,
        expense,
        undefined,
        undefined,
        `Dépense enregistrée : ${expense.title} - ${expense.amount}`,
      ),
    );
    return expense;
  }
}
