// ================================================================
// DOMAIN LAYER — Value Objects
// Objets sans identité propre, définis uniquement par leurs valeurs.
// Immuables et auto-validants.
// ================================================================

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

/**
 * Value Object représentant une plage de dates.
 * Garantit que la date de début précède la date de fin.
 */
export class DateRange {
  private constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) {}

  static create(from: Date, to: Date): DateRange {
    if (from >= to) {
      throw new Error(
        `DateRange invalide : la date de début (${from.toISOString()}) doit précéder la date de fin (${to.toISOString()})`,
      );
    }
    return new DateRange(from, to);
  }

  /** Durée en millisecondes */
  get durationMs(): number {
    return this.to.getTime() - this.from.getTime();
  }

  /** Plage de la période équivalente précédente (même durée, juste avant) */
  get previousRange(): DateRange {
    const duration = this.durationMs;
    return new DateRange(
      new Date(this.from.getTime() - duration),
      new Date(this.from),
    );
  }
}

/**
 * Value Object représentant une période métier (jour, semaine, mois, année)
 * avec calcul automatique des plages courante et précédente.
 */
export class Period {
  public readonly current: DateRange;
  public readonly previous: DateRange;
  public readonly type: PeriodType;

  private constructor(
    type: PeriodType,
    current: DateRange,
    previous: DateRange,
  ) {
    this.type = type;
    this.current = current;
    this.previous = previous;
  }

  static fromType(periodType: PeriodType): Period {
    const now = new Date();
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth();
    const d = now.getUTCDate();
    const dow = now.getUTCDay();

    let currentStart: Date;
    const currentEnd: Date = new Date();

    switch (periodType) {
      case 'day': {
        currentStart = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
        break;
      }
      case 'week': {
        currentStart = new Date(Date.UTC(y, mo, d - dow, 0, 0, 0, 0));
        break;
      }
      case 'month': {
        currentStart = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
        break;
      }
      case 'year': {
        currentStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
        break;
      }
      default:
        currentStart = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
    }

    const current = DateRange.create(currentStart, currentEnd);
    const previous = current.previousRange;
    return new Period(periodType, current, previous);
  }

  static fromCustomRange(from: Date, to: Date): Period {
    const current = DateRange.create(from, to);
    const previous = current.previousRange;
    return new Period('custom', current, previous);
  }

  /** Granularité suggérée pour les graphiques */
  get granularity(): 'hourly' | 'daily' | 'monthly' {
    switch (this.type) {
      case 'day':
        return 'hourly';
      case 'year':
        return 'monthly';
      default:
        return 'daily';
    }
  }

  /** Formate une date en clé selon la granularité */
  formatTimeKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());

    switch (this.granularity) {
      case 'hourly':
        return `${y}-${m}-${d} ${h}:00`;
      case 'monthly':
        return `${y}-${m}`;
      default:
        return `${y}-${m}-${d}`;
    }
  }
}

/**
 * Value Object représentant un montant monétaire avec sa devise.
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static of(amount: number, currency: string = 'XOF'): Money {
    if (amount < 0)
      throw new Error('Un montant monétaire ne peut pas être négatif');
    return new Money(amount, currency);
  }

  static zero(currency: string = 'XOF'): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (other.currency !== this.currency)
      throw new Error(
        `Devises incompatibles : ${this.currency} vs ${other.currency}`,
      );
    return new Money(this.amount + other.amount, this.currency);
  }

  /** Taux d'évolution par rapport à un montant précédent */
  evolutionFrom(previous: Money): number {
    if (previous.amount === 0) return this.amount > 0 ? 100 : 0;
    return parseFloat(
      (((this.amount - previous.amount) / previous.amount) * 100).toFixed(2),
    );
  }

  format(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
    }).format(this.amount);
  }
}

/**
 * Value Object pour les filtres du dashboard (boutiques sélectionnées).
 */
export class ShopFilter {
  private constructor(public readonly shopIds: string[] | null) {}

  static all(): ShopFilter {
    return new ShopFilter(null);
  }

  static forShops(ids: string[]): ShopFilter {
    if (ids.length === 0)
      throw new Error('La liste de boutiques ne peut pas être vide');
    return new ShopFilter(ids);
  }

  static fromQuery(shopIds?: string): ShopFilter {
    if (!shopIds || shopIds.trim() === '') return ShopFilter.all();
    const ids = shopIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    return ids.length > 0 ? ShopFilter.forShops(ids) : ShopFilter.all();
  }

  get isAll(): boolean {
    return this.shopIds === null;
  }

  /** Clause Prisma compatible */
  toPrismaWhere(): Record<string, unknown> {
    if (this.isAll) return {};
    return { shopId: { in: this.shopIds } };
  }
}

// ── Shop Performance KPI ─────────────────────────────────────────

export class ShopKpi {
  constructor(
    public readonly shopId: string,
    public readonly shopName: string,
    public readonly revenue: number,
    public readonly previousRevenue: number,
    public readonly transactions: number,
    public readonly expenses: number,
    public readonly cogs: number,
    public readonly totalDiscounts: number,
    public readonly voidedCount: number,
    public readonly currency: string,
  ) {}

  get revenueEvolution(): number {
    if (this.previousRevenue === 0) return this.revenue > 0 ? 100 : 0;
    return parseFloat((((this.revenue - this.previousRevenue) / this.previousRevenue) * 100).toFixed(2));
  }

  get averageBasket(): number {
    if (this.transactions === 0) return 0;
    return parseFloat((this.revenue / this.transactions).toFixed(2));
  }

  get netResult(): number {
    return this.revenue - this.cogs - this.expenses;
  }

  get voidRate(): number {
    if (this.transactions === 0) return 0;
    return parseFloat(((this.voidedCount / this.transactions) * 100).toFixed(2));
  }
}

// ── Top Sold Product ─────────────────────────────────────────────

export class TopProduct {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly revenue: number,
    public readonly quantity: number,
  ) {}
}

// ── Category Performance ─────────────────────────────────────────

export class CategoryPerformance {
  constructor(
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly colorHex: string,
    public readonly revenue: number,
    public readonly cogs: number,
    public readonly quantity: number,
    public readonly transactions: number,
    public readonly totalRevenue: number,
    public readonly topProducts: TopProduct[],
  ) {}

  get grossMargin(): number {
    return this.revenue - this.cogs;
  }

  get grossMarginRate(): number {
    if (this.revenue === 0) return 0;
    return parseFloat(((this.grossMargin / this.revenue) * 100).toFixed(2));
  }

  get revenueShare(): number {
    if (this.totalRevenue === 0) return 0;
    return parseFloat(((this.revenue / this.totalRevenue) * 100).toFixed(2));
  }
}

// ── Cashier Performance ──────────────────────────────────────────

export class CashierPerformance {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly username: string,
    public readonly role: string,
    public readonly shopId: string,
    public readonly shopName: string,
    public readonly revenue: number,
    public readonly previousRevenue: number,
    public readonly transactions: number,
    public readonly voidedSales: number,
    public readonly totalDiscounts: number,
    public readonly activeMinutes: number | null,
    public readonly sessionCount: number,
    public readonly cashDifference: number,
  ) {}

  get revenueEvolution(): number {
    if (this.previousRevenue === 0) return this.revenue > 0 ? 100 : 0;
    return parseFloat((((this.revenue - this.previousRevenue) / this.previousRevenue) * 100).toFixed(2));
  }

  get averageBasket(): number {
    if (this.transactions === 0) return 0;
    return parseFloat((this.revenue / this.transactions).toFixed(2));
  }

  get voidRate(): number {
    if (this.transactions === 0) return 0;
    return parseFloat(((this.voidedSales / this.transactions) * 100).toFixed(2));
  }

  get discountRate(): number {
    if (this.revenue === 0) return 0;
    return parseFloat(((this.totalDiscounts / this.revenue) * 100).toFixed(2));
  }

  get revenuePerHour(): number | null {
    if (!this.activeMinutes || this.activeMinutes === 0) return null;
    const hours = this.activeMinutes / 60;
    return parseFloat((this.revenue / hours).toFixed(2));
  }
}

// ── Operational Alerts ───────────────────────────────────────────

export enum AlertType {
  LOW_STOCK = 'LOW_STOCK',
  UNCLOSED_SESSIONS = 'UNCLOSED_SESSIONS',
  HIGH_DEBT_CUSTOMERS = 'HIGH_DEBT_CUSTOMERS',
  HIGH_VOID_RATE = 'HIGH_VOID_RATE',
  CASH_DISCREPANCY = 'CASH_DISCREPANCY',
  SYNC_PENDING = 'SYNC_PENDING',
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export class DashboardAlert {
  constructor(
    public readonly type: AlertType,
    public readonly severity: AlertSeverity,
    public readonly message: string,
    public readonly count: number,
    public readonly metadata: unknown,
  ) {}
}
