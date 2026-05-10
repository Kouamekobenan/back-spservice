import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { IExpenseRepository } from '../../domain/interfaces/expense.repository.interface.js';
import { Expense, ExpenseCategory } from '../../domain/entities/expense.entity.js';
import { CreateExpenseDto } from '../../application/dtos/create-expense.dto.js';
import { UpdateExpenseDto } from '../../application/dtos/update-expense.dto.js';
import { ExpenseMapper } from '../../domain/mappers/expense.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class PrismaExpenseRepository implements IExpenseRepository {
  private readonly logger = new Logger(PrismaExpenseRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ExpenseMapper,
  ) {}

  async create(data: CreateExpenseDto): Promise<Expense> {
    try {
      const expense = await this.prisma.expense.create({
        data: {
          title: data.title,
          category: data.category,
          amount: data.amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          receiptUrl: data.receiptUrl,
          isRecurring: data.isRecurring || false,
          recurringDay: data.recurringDay,
          shopId: data.shopId,
        },
      });
      return this.mapper.toDomain(expense);
    } catch (error) {
      this.logger.error('Erreur lors de la création de la dépense', error);
      throw new InternalServerErrorException('Échec de la création de la dépense');
    }
  }

  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    try {
      const expense = await this.prisma.expense.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
        },
      });
      return this.mapper.toDomain(expense);
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de la dépense ${id}`, error);
      throw new InternalServerErrorException('Échec de la mise à jour de la dépense');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.expense.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression de la dépense ${id}`, error);
      throw new InternalServerErrorException('Échec de la suppression de la dépense');
    }
  }

  async findById(id: string): Promise<Expense | null> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    return expense ? this.mapper.toDomain(expense) : null;
  }

  async findAll(filters: { shopId?: string; category?: ExpenseCategory; startDate?: Date; endDate?: Date }): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        shopId: filters.shopId,
        category: filters.category,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
    return expenses.map((e) => this.mapper.toDomain(e));
  }
}
