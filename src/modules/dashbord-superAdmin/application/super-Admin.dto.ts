// ================================================================
// APPLICATION LAYER — DTOs (Data Transfer Objects)
// Décorés avec class-validator (validation) + @nestjs/swagger (docs)
// Utilisés en entrée (Query) et en sortie (Response) des Use Cases.
// ================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateIf,
  IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ================================================================
// DTOs D'ENTRÉE (Query / Request)
// ================================================================

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

/**
 * DTO de base pour les paramètres de période.
 * Partagé par tous les endpoints du dashboard.
 */
export class PeriodQueryDto {
  @ApiPropertyOptional({
    enum: ['day', 'week', 'month', 'year', 'custom'],
    default: 'month',
    description:
      "Période d'analyse. Utiliser 'custom' avec startDate et endDate.",
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year', 'custom'])
  period?: PeriodType = 'month';

  @ApiPropertyOptional({
    description: "Date de début (ISO 8601) — requis si period = 'custom'",
    example: '2026-01-01T00:00:00.000Z',
  })
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Date de fin (ISO 8601) — requis si period = 'custom'",
    example: '2026-03-31T23:59:59.999Z',
  })
  @ValidateIf((o) => o.period === 'custom')
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'IDs des boutiques à filtrer (séparés par des virgules). Omis = toutes les boutiques.',
    example: 'uuid-shop-1,uuid-shop-2',
  })
  @IsOptional()
  @IsString()
  shopIds?: string;
}

/**
 * DTO de requête avec pagination pour les classements.
 */
export class RankedQueryDto extends PeriodQueryDto {
  @ApiPropertyOptional({
    description: "Nombre maximum d'éléments à retourner",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * DTO de requête pour les alertes.
 */
export class AlertsQueryDto {
  @ApiPropertyOptional({
    description: 'Seuil de dette client en XOF pour les alertes crédit',
    default: 50000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  debtThreshold?: number = 50000;

  @ApiPropertyOptional({
    description: "Seuil d'écart de caisse en XOF",
    default: 5000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  cashDiscrepancyThreshold?: number = 5000;

  @ApiPropertyOptional({
    description: 'Nombre de jours en arrière pour les écarts de caisse',
    default: 7,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  lookbackDays?: number = 7;
}

// ================================================================
// DTOs DE SORTIE (Response)
// ================================================================

// ── Primitives réutilisables ─────────────────────────────────────

export class DateRangeDto {
  @ApiProperty({
    description: 'Début de la période',
    example: '2026-05-01T00:00:00.000Z',
  })
  from!: Date;

  @ApiProperty({
    description: 'Fin de la période',
    example: '2026-05-17T23:59:59.999Z',
  })
  to!: Date;
}

export class EvolutionDto {
  @ApiProperty({
    description: 'Valeur de la période courante',
    example: 4500000,
  })
  value!: number;

  @ApiProperty({
    description: 'Valeur de la période précédente',
    example: 3800000,
  })
  previous!: number;

  @ApiProperty({ description: "Taux d'évolution en %", example: 18.42 })
  evolution!: number;
}

export class MoneyDto {
  @ApiProperty({
    description: 'Montant en unité monétaire locale',
    example: 4500000,
  })
  value!: number;

  @ApiProperty({ description: 'Devise ISO 4217', example: 'XOF' })
  currency!: string;
}

// ── ROUTE 1 : Overview KPIs ──────────────────────────────────────

export class RevenueKpiDto extends EvolutionDto {
  @ApiProperty({ description: 'Devise', example: 'XOF' })
  currency!: string;
}

export class MarginKpiDto {
  @ApiProperty({ description: 'Marge brute en XOF', example: 1200000 })
  value!: number;

  @ApiProperty({ description: 'Taux de marge brute en %', example: 26.67 })
  rate!: number;

  @ApiProperty({ description: 'Devise', example: 'XOF' })
  currency!: string;
}

export class CreditKpiDto {
  @ApiProperty({
    description: 'Montant total des créances clients en XOF',
    example: 850000,
  })
  amount!: number;

  @ApiProperty({ description: 'Nombre de clients en crédit', example: 23 })
  customersCount!: number;
}

export class NetResultKpiDto {
  @ApiProperty({
    description: 'Résultat net opérationnel en XOF',
    example: 750000,
  })
  value!: number;

  @ApiProperty({
    description: 'true si le résultat est bénéficiaire',
    example: true,
  })
  isProfit!: boolean;
}

export class OverviewKpisDto {
  @ApiProperty({ type: RevenueKpiDto })
  revenue!: RevenueKpiDto;

  @ApiProperty({ type: EvolutionDto, description: 'Nombre de transactions' })
  transactions!: EvolutionDto;

  @ApiProperty({ type: MarginKpiDto })
  grossMargin!: MarginKpiDto;

  @ApiProperty({ type: EvolutionDto, description: 'Total des dépenses' })
  expenses!: EvolutionDto;

  @ApiProperty({ type: NetResultKpiDto })
  netResult!: NetResultKpiDto;

  @ApiProperty({ type: CreditKpiDto })
  creditOutstanding!: CreditKpiDto;

  @ApiProperty({ description: 'Nouveaux clients sur la période', example: 15 })
  newCustomers!: number;

  @ApiProperty({ description: 'Nombre de boutiques actives', example: 5 })
  activeShops!: number;

  @ApiProperty({ description: 'Panier moyen en XOF', example: 8500 })
  averageBasket!: number;

  @ApiProperty({
    description: 'Total des remises accordées en XOF',
    example: 120000,
  })
  totalDiscounts!: number;
}

export class OverviewResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({ type: OverviewKpisDto })
  kpis!: OverviewKpisDto;
}

// ── ROUTE 2 : Performance Boutiques ─────────────────────────────

export class ShopPerformanceItemDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'Superette Centre-Ville' })
  shopName!: string;

  @ApiProperty({ example: 'Cocody, Abidjan', nullable: true })
  address!: string | null;

  @ApiProperty({ example: 'XOF' })
  currency!: string;

  @ApiProperty({ description: 'CA de la période', example: 4500000 })
  revenue!: number;

  @ApiProperty({ description: 'CA période précédente', example: 3800000 })
  previousRevenue!: number;

  @ApiProperty({ description: 'Évolution du CA en %', example: 18.42 })
  evolution!: number;

  @ApiProperty({ description: 'Nombre de transactions', example: 530 })
  transactions!: number;

  @ApiProperty({ description: 'Panier moyen en XOF', example: 8490 })
  averageBasket!: number;

  @ApiProperty({ description: 'Total des remises accordées', example: 120000 })
  totalDiscounts!: number;

  @ApiProperty({
    description: 'Total dépenses opérationnelles',
    example: 850000,
  })
  expenses!: number;

  @ApiProperty({ description: 'Marge brute en XOF (CA - COGS)', example: 1300000 })
  grossMargin!: number;

  @ApiProperty({ description: 'Taux de marge brute en %', example: 28.89 })
  marginRate!: number;

  @ApiProperty({
    description: 'Résultat net = marge brute - dépenses',
    example: 750000,
  })
  netResult!: number;

  @ApiProperty({ description: "Taux d'annulation en %", example: 1.2 })
  voidRate!: number;

  @ApiProperty({
    description: 'Rang dans le classement (1 = meilleur CA)',
    example: 1,
  })
  rank!: number;
}

export class ShopsPerformanceTotalsDto {
  @ApiProperty({ example: 18500000 })
  revenue!: number;

  @ApiProperty({ example: 2150 })
  transactions!: number;

  @ApiProperty({ example: 3200000 })
  expenses!: number;

  @ApiProperty({ example: 2800000 })
  netResult!: number;
}

export class ShopsPerformanceResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({ type: [ShopPerformanceItemDto] })
  shops!: ShopPerformanceItemDto[];

  @ApiProperty({ type: ShopsPerformanceTotalsDto })
  totals!: ShopsPerformanceTotalsDto;

  @ApiProperty({ description: 'Nombre total de boutiques actives', example: 5 })
  totalShops!: number;
}

// ── ROUTE 3 : Performance Catégories ────────────────────────────

export class TopProductDto {
  @ApiProperty({ example: 'uuid-product-1' })
  productId!: string;

  @ApiProperty({ example: 'Riz parfumé 25kg' })
  productName!: string;

  @ApiProperty({ example: 980000 })
  revenue!: number;

  @ApiProperty({ example: 39.2 })
  quantity!: number;
}

export class CategoryPerformanceItemDto {
  @ApiProperty({ example: 'uuid-category-1' })
  categoryId!: string;

  @ApiProperty({ example: 'Alimentation' })
  categoryName!: string;

  @ApiProperty({
    example: '#22C55E',
    description: 'Couleur HEX pour les graphiques',
  })
  colorHex!: string;

  @ApiProperty({ example: 4500000 })
  revenue!: number;

  @ApiProperty({
    example: 3200000,
    description: "Coût d'achat des marchandises vendues",
  })
  cogs!: number;

  @ApiProperty({ example: 1300000 })
  grossMargin!: number;

  @ApiProperty({ example: 28.89 })
  grossMarginRate!: number;

  @ApiProperty({ example: 24.32, description: 'Part du CA total en %' })
  revenueShare!: number;

  @ApiProperty({ example: 1240.5 })
  quantity!: number;

  @ApiProperty({ example: 412 })
  transactions!: number;

  @ApiProperty({ type: [TopProductDto] })
  topProducts!: TopProductDto[];
}

export class CategoriesPerformanceResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({
    example: 'all',
    description: "ID de la boutique filtrée ou 'all'",
  })
  shopId!: string;

  @ApiProperty({ example: 18500000, description: 'CA total cross-catégories' })
  totalRevenue!: number;

  @ApiProperty({ type: [CategoryPerformanceItemDto] })
  categories!: CategoryPerformanceItemDto[];
}

// ── ROUTE 4 : Performance Caissiers ─────────────────────────────

export class CashierPerformanceItemDto {
  @ApiProperty({ example: 'uuid-user-1' })
  userId!: string;

  @ApiProperty({ example: 'Kouassi Ama' })
  name!: string;

  @ApiProperty({ example: 'k.ama' })
  username!: string;

  @ApiProperty({ example: 'CASHIER' })
  role!: string;

  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'Superette Centre-Ville' })
  shopName!: string;

  @ApiProperty({ example: 1850000 })
  revenue!: number;

  @ApiProperty({ example: 1620000 })
  previousRevenue!: number;

  @ApiProperty({ example: 14.2 })
  evolution!: number;

  @ApiProperty({ example: 218 })
  transactions!: number;

  @ApiProperty({ example: 8486 })
  averageBasket!: number;

  @ApiProperty({ example: 3, description: 'Nombre de ventes annulées' })
  voidedSales!: number;

  @ApiProperty({ example: 1.36, description: "Taux d'annulation en %" })
  voidRate!: number;

  @ApiProperty({ example: 45000, description: 'Total des remises accordées' })
  totalDiscounts!: number;

  @ApiProperty({ example: 2.43, description: '% de remises sur CA' })
  discountRate!: number;

  @ApiProperty({
    example: 480,
    description: 'Minutes actives en caisse',
    nullable: true,
  })
  activeMinutes!: number | null;

  @ApiProperty({
    example: 6,
    description: 'Nombre de sessions de caisse ouvertes',
  })
  sessionCount!: number;

  @ApiProperty({ example: -500, description: 'Écart cumulé de caisse en XOF' })
  cashDifference!: number;

  @ApiProperty({
    example: 231250,
    description: 'CA par heure de travail en XOF',
    nullable: true,
  })
  revenuePerHour!: number | null;

  @ApiProperty({ example: 1 })
  rank!: number;
}

export class CashiersSummaryDto {
  @ApiProperty({ example: 8 })
  totalCashiers!: number;

  @ApiProperty({ example: 18500000 })
  totalRevenue!: number;

  @ApiProperty({ example: 2150 })
  totalTransactions!: number;

  @ApiProperty({ example: 12 })
  totalVoids!: number;
}

export class CashiersPerformanceResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({ example: 'all' })
  shopId!: string;

  @ApiProperty({ type: [CashierPerformanceItemDto] })
  cashiers!: CashierPerformanceItemDto[];

  @ApiProperty({ type: CashiersSummaryDto })
  summary!: CashiersSummaryDto;
}

// ── ROUTE 5 : Timeline ──────────────────────────────────────────

export class TimelinePointDto {
  @ApiProperty({
    example: '2026-05-17',
    description: 'Clé temporelle selon la granularité',
  })
  timeKey!: string;

  @ApiProperty({ example: 1250000 })
  revenue!: number;

  @ApiProperty({ example: 143 })
  transactions!: number;
}

export class ShopTimelineDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'Superette Centre-Ville' })
  shopName!: string;

  @ApiProperty({ type: [TimelinePointDto] })
  data!: TimelinePointDto[];
}

export class TimelineStatsDto {
  @ApiProperty({ example: 18500000 })
  totalRevenue!: number;

  @ApiProperty({ example: 925000 })
  averagePerPeriod!: number;

  @ApiProperty({ type: TimelinePointDto, nullable: true })
  bestPeriod!: TimelinePointDto | null;

  @ApiProperty({ type: TimelinePointDto, nullable: true })
  worstPeriod!: TimelinePointDto | null;

  @ApiProperty({ example: 20 })
  totalDataPoints!: number;
}

export class SalesTimelineResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({ enum: ['hourly', 'daily', 'monthly'] })
  granularity!: 'hourly' | 'daily' | 'monthly';

  @ApiProperty({ type: [TimelinePointDto] })
  timeline!: TimelinePointDto[];

  @ApiProperty({
    type: [ShopTimelineDto],
    description: 'Données par boutique pour graphiques empilés',
  })
  byShop!: ShopTimelineDto[];

  @ApiProperty({ type: TimelineStatsDto })
  stats!: TimelineStatsDto;
}

// ── ROUTE 6 : Alertes ───────────────────────────────────────────

export class AlertItemDto {
  @ApiProperty({
    enum: [
      'LOW_STOCK',
      'UNCLOSED_SESSIONS',
      'HIGH_DEBT_CUSTOMERS',
      'HIGH_VOID_RATE',
      'CASH_DISCREPANCY',
      'SYNC_PENDING',
    ],
  })
  type!: string;

  @ApiProperty({ enum: ['critical', 'warning', 'info'] })
  severity!: string;

  @ApiProperty({ example: '3 produit(s) en stock bas ou rupture' })
  message!: string;

  @ApiProperty({ example: 3, description: "Nombre d'éléments concernés" })
  count!: number;

  @ApiProperty({
    description: "Données spécifiques à l'alerte (variable selon le type)",
  })
  details: unknown;
}

export class AlertsResponseDto {
  @ApiProperty({ type: Date, example: '2026-05-17T14:30:00.000Z' })
  generatedAt!: Date;

  @ApiProperty({ example: 4 })
  totalAlerts!: number;

  @ApiProperty({
    example: 2,
    description: 'Alertes critiques nécessitant une action immédiate',
  })
  criticalCount!: number;

  @ApiProperty({ example: 2 })
  warningCount!: number;

  @ApiProperty({ type: [AlertItemDto] })
  alerts!: AlertItemDto[];
}

// ── ROUTE 7 : Rapport Financier ──────────────────────────────────

export class ExpenseCategoryDto {
  @ApiProperty({ example: 'SALARY' })
  category!: string;

  @ApiProperty({ example: 500000 })
  amount!: number;

  @ApiProperty({ example: 42.5, description: 'Part des dépenses totales en %' })
  share!: number;
}

export class PnLRevenueDto {
  @ApiProperty({ example: 18750000, description: 'CA brut avant remises' })
  gross!: number;

  @ApiProperty({ example: 250000 })
  discounts!: number;

  @ApiProperty({ example: 18500000, description: 'CA net après remises' })
  net!: number;

  @ApiProperty({
    example: 8.33,
    description: 'Évolution vs période précédente en %',
  })
  evolution!: number;

  @ApiProperty({ example: 2150 })
  transactions!: number;
}

export class PnLCogsDto {
  @ApiProperty({ example: 13500000 })
  value!: number;

  @ApiProperty({ example: 72.97, description: 'Part du CA en %' })
  rate!: number;
}

export class PnLMarginDto {
  @ApiProperty({ example: 5000000 })
  value!: number;

  @ApiProperty({ example: 27.03 })
  rate!: number;
}

export class PnLExpensesDto {
  @ApiProperty({ example: 1750000 })
  total!: number;

  @ApiProperty({ type: [ExpenseCategoryDto] })
  byCategory!: ExpenseCategoryDto[];
}

export class PnLResultDto {
  @ApiProperty({ example: 3250000 })
  value!: number;

  @ApiProperty({ example: true })
  isProfit!: boolean;
}

export class PnLNetResultDto extends PnLResultDto {
  @ApiProperty({ example: 17.57, description: 'Taux de marge nette en %' })
  margin!: number;
}

export class PnLDto {
  @ApiProperty({ type: PnLRevenueDto })
  revenue!: PnLRevenueDto;

  @ApiProperty({ type: PnLCogsDto })
  cogs!: PnLCogsDto;

  @ApiProperty({ type: PnLMarginDto })
  grossMargin!: PnLMarginDto;

  @ApiProperty({ type: PnLExpensesDto })
  expenses!: PnLExpensesDto;

  @ApiProperty({ type: PnLResultDto })
  operatingResult!: PnLResultDto;

  @ApiProperty({ example: 150000 })
  taxes!: number;

  @ApiProperty({ type: PnLNetResultDto })
  netResult!: PnLNetResultDto;
}

export class FinancialReportResponseDto {
  @ApiProperty({ enum: ['day', 'week', 'month', 'year', 'custom'] })
  period!: PeriodType;

  @ApiProperty({ type: DateRangeDto })
  dateRange!: DateRangeDto;

  @ApiProperty({ example: 'XOF' })
  currency!: string;

  @ApiProperty({ type: PnLDto })
  pnl!: PnLDto;

  @ApiProperty({
    description: 'Données de la période précédente pour comparaison',
  })
  previousPeriod!: { revenue: number };
}
