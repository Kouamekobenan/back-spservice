import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { UpdateExpenseDto } from '../dtos/update-expense.dto.js';
import { Expense } from '../../domain/entities/expense.entity.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new NotFoundException(`Dépense ${id} non trouvée.`);

    const updateExpense = await this.expenseRepository.update(id, data);

    this.eventEmitter.emit(
      'audit.updated',
      new AuditEvent(
        AuditAction.UPDATE,
        'Expense',
        id,
        data.userId || 'system-user',
        expense.shopId,
        expense,
        updateExpense,
        undefined,
        undefined,
        `Dépense modifiée : ${expense.title} - ${expense.amount}`,
      ),
    );
    return updateExpense;
  }
}
