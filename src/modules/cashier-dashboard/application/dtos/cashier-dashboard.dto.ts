import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

// ── Query ─────────────────────────────────────────────────────────

export class CashierOverviewQueryDto {
  @ApiProperty({ description: 'ID du caissier', example: 'uuid-user' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'ID de la boutique', example: 'uuid-shop' })
  @IsUUID()
  shopId!: string;

  @ApiPropertyOptional({
    description: 'Date (YYYY-MM-DD) — défaut: aujourd\'hui',
    example: '2026-06-04',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

// ── Sous-types de réponse ─────────────────────────────────────────

export class CashierInfoDto {
  @ApiProperty() userId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() username!: string;
  @ApiProperty() role!: string;
}

export class SessionInfoDto {
  @ApiPropertyOptional() id!: string | null;
  @ApiPropertyOptional() openedAt!: string | null;
  @ApiPropertyOptional() openingBalance!: number;
  @ApiPropertyOptional() expectedBalance!: number | null;
  @ApiPropertyOptional() closingBalance!: number | null;
  @ApiPropertyOptional() difference!: number | null;
  @ApiProperty() isOpen!: boolean;
}

export class KpisDto {
  @ApiProperty() revenue!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() totalTransactions!: number;
  @ApiProperty() completedTransactions!: number;
  @ApiProperty() voidedTransactions!: number;
  @ApiProperty() voidRate!: number;
  @ApiProperty() averageBasket!: number;
  @ApiProperty() totalDiscounts!: number;
  @ApiProperty() totalChange!: number;
  @ApiProperty() totalPaid!: number;
}

export class PaymentBreakdownDto {
  @ApiProperty() method!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() count!: number;
  @ApiProperty() share!: number;
}

export class TimelinePointDto {
  @ApiProperty() hour!: string;
  @ApiProperty() revenue!: number;
  @ApiProperty() transactionCount!: number;
}

export class RecentSaleDto {
  @ApiProperty() id!: string;
  @ApiProperty() receiptNumber!: string;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() status!: string;
  @ApiProperty() paymentMethod!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty() createdAt!: string;
}

export class PeriodDto {
  @ApiProperty() date!: string;
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
}

// ── Réponse principale ────────────────────────────────────────────

export class CashierOverviewResponseDto {
  @ApiProperty({ type: PeriodDto })             period!: PeriodDto;
  @ApiProperty({ type: CashierInfoDto })        cashier!: CashierInfoDto;
  @ApiProperty({ type: SessionInfoDto })        session!: SessionInfoDto;
  @ApiProperty({ type: KpisDto })               kpis!: KpisDto;
  @ApiProperty({ type: [PaymentBreakdownDto] }) payments!: PaymentBreakdownDto[];
  @ApiProperty({ type: [TimelinePointDto] })    timeline!: TimelinePointDto[];
  @ApiProperty({ type: [RecentSaleDto] })       recentSales!: RecentSaleDto[];
}
