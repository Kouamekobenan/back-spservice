import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export class InventoryQueryDto {
  @ApiPropertyOptional({
    enum: ['day', 'week', 'month', 'year', 'custom'],
    default: 'month',
    description: "Période d'analyse",
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year', 'custom'])
  period?: PeriodType = 'month';

  @ApiPropertyOptional({
    description: "Date de début ISO 8601 — requis si period='custom'",
    example: '2026-06-01T00:00:00.000Z',
  })
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Date de fin ISO 8601 — requis si period='custom'",
    example: '2026-06-17T23:59:59.999Z',
  })
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Nombre de produits dans le classement top vendeurs',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export function buildDateRange(
  period?: PeriodType,
  startDate?: string,
  endDate?: string,
): { from: Date; to: Date } {
  if (period === 'custom' && startDate && endDate) {
    return { from: new Date(startDate), to: new Date(endDate) };
  }
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const d = now.getUTCDate();

  let from: Date;
  switch (period) {
    case 'day':
      from = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
      break;
    case 'week':
      from = new Date(Date.UTC(y, mo, d - now.getUTCDay(), 0, 0, 0, 0));
      break;
    case 'year':
      from = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
      break;
    default:
      from = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
  }
  return { from, to: now };
}
