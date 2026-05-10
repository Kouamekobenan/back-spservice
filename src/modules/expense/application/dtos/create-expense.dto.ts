import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsPositive, IsOptional, IsDateString, IsBoolean, IsInt, Min, Max, IsUUID } from 'class-validator';
import { ExpenseCategory } from '../../domain/entities/expense.entity.js';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Loyer Mai 2026', description: 'Titre de la dépense' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.RENT })
  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @ApiProperty({ example: 150000, description: 'Montant de la dépense' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-05-10T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 'Paiement du loyer du local principal', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://cdn.example.com/receipts/123.jpg', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ example: 5, description: 'Jour du mois pour la récurrence', required: false })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  recurringDay?: number;

  @ApiProperty({ example: 'shop-uuid-123' })
  @IsUUID()
  @IsNotEmpty()
  shopId: string;
}
