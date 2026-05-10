import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ExpenseCategory } from '../../domain/entities/expense.entity.js';

export class FilterExpenseDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  shopId?: string;

  @ApiProperty({ required: false, enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @ApiProperty({ required: false, description: 'Date de début (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Date de fin (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
