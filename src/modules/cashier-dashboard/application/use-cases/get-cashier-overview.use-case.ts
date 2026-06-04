import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICashierDashboardRepository } from '../../domain/interfaces/cashier-dashboard.repository.interface.js';
import type {
  CashierOverviewQueryDto,
  CashierOverviewResponseDto,
  PaymentBreakdownDto,
  TimelinePointDto,
} from '../dtos/cashier-dashboard.dto.js';
@Injectable()
export class GetCashierOverviewUseCase {
  constructor(
    @Inject('ICashierDashboardRepository')
    private readonly repo: ICashierDashboardRepository,
  ) {}

  async execute(query: CashierOverviewQueryDto): Promise<CashierOverviewResponseDto> {
    // ── 1. Construire la plage de la journée en UTC ───────────────────
    const targetDate = query.date ? new Date(query.date) : new Date();
    const y  = targetDate.getUTCFullYear();
    const mo = targetDate.getUTCMonth();
    const d  = targetDate.getUTCDate();

    const from = new Date(Date.UTC(y, mo, d, 0,  0,  0, 0));
    const to   = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999));

    const dateLabel = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // ── 2. Requêtes parallèles ────────────────────────────────────────
    const [cashierInfo, daySales, payments, timeline, recentSales, session] =
      await Promise.all([
        this.repo.getCashierInfo(query.userId),
        this.repo.getDaySales(query.userId, query.shopId, from, to),
        this.repo.getPaymentBreakdown(query.userId, query.shopId, from, to),
        this.repo.getSalesTimeline(query.userId, query.shopId, from, to),
        this.repo.getRecentSales(query.userId, query.shopId, from, to, 10),
        this.repo.getActiveSession(query.userId, query.shopId),
      ]);

    if (!cashierInfo) {
      throw new NotFoundException(`Caissier ${query.userId} introuvable`);
    }

    // ── 3. Calculs métier ─────────────────────────────────────────────
    const totalTx    = daySales.transactionCount;
    const voidedTx   = daySales.voidedCount;
    const voidRate   = (totalTx + voidedTx) > 0
      ? parseFloat(((voidedTx / (totalTx + voidedTx)) * 100).toFixed(2))
      : 0;
    const avgBasket  = totalTx > 0
      ? parseFloat((daySales.totalRevenue / totalTx).toFixed(0))
      : 0;

    // Répartition des paiements avec pourcentage
    const totalPaymentAmount = payments.reduce((s, p) => s + p.amount, 0);
    const paymentBreakdown: PaymentBreakdownDto[] = payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      count:  p.count,
      share:  totalPaymentAmount > 0
        ? parseFloat(((p.amount / totalPaymentAmount) * 100).toFixed(2))
        : 0,
    }));

    // Timeline avec libellé heure lisible
    const timelinePoints: TimelinePointDto[] = timeline.map((t) => ({
      hour:             `${String(t.hour).padStart(2, '0')}:00`,
      revenue:          t.revenue,
      transactionCount: t.transactionCount,
    }));

    // ── 4. Assembler la réponse ───────────────────────────────────────
    return {
      period: {
        date: dateLabel,
        from: from.toISOString(),
        to:   to.toISOString(),
      },
      cashier: {
        userId:   query.userId,
        name:     cashierInfo.name,
        username: cashierInfo.username,
        role:     cashierInfo.role,
      },
      session: session
        ? {
            id:              session.id,
            openedAt:        session.openedAt.toISOString(),
            openingBalance:  session.openingBalance,
            expectedBalance: session.expectedBalance,
            closingBalance:  session.closingBalance,
            difference:      session.difference,
            isOpen:          session.closedAt === null,
          }
        : {
            id:              null,
            openedAt:        null,
            openingBalance:  0,
            expectedBalance: null,
            closingBalance:  null,
            difference:      null,
            isOpen:          false,
          },
      kpis: {
        revenue:               daySales.totalRevenue,
        currency:              'XOF',
        totalTransactions:     totalTx,
        completedTransactions: totalTx,
        voidedTransactions:    voidedTx,
        voidRate,
        averageBasket:         avgBasket,
        totalDiscounts:        daySales.totalDiscounts,
        totalChange:           daySales.totalChange,
        totalPaid:             daySales.totalPaid,
      },
      payments: paymentBreakdown,
      timeline: timelinePoints,
      recentSales: recentSales.map((s) => ({
        id:                   s.id,
        receiptNumber:        s.receiptNumber,
        totalAmount:          s.totalAmount,
        status:               s.status,
        paymentMethod:        s.primaryPaymentMethod,
        itemCount:            s.itemCount,
        createdAt:            s.createdAt,
      })),
    };
  }
}
