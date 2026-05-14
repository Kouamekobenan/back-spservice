import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new NotFoundException(`Dépense ${id} non trouvée.`);

    await this.expenseRepository.delete(id);

    this.eventEmitter.emit(
      'audit.deleted',
      new AuditEvent(
        AuditAction.DELETE,
        'Expense',
        id,
        userId,
        expense.shopId,
        expense,
        undefined,
        undefined,
        undefined,
        `Dépense supprimée : ${expense.title} - ${expense.amount}`,
      ),
    );
  }
}
