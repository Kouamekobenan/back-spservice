export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SALARY = 'SALARY',
  SUPPLIES = 'SUPPLIES',
  TRANSPORT = 'TRANSPORT',
  MAINTENANCE = 'MAINTENANCE',
  TAXES = 'TAXES',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER',
}

export class Expense {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: ExpenseCategory,
    public readonly amount: number,
    public readonly date: Date,
    public readonly description: string | null,
    public readonly receiptUrl: string | null,
    public readonly isRecurring: boolean,
    public readonly recurringDay: number | null,
    public readonly shopId: string,
    public readonly syncStatus: string,
    public readonly localId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
