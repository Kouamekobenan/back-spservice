import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  ICashierDashboardRepository,
  RawDaySales,
  RawPaymentBreakdown,
  RawTimelinePoint,
  RawRecentSale,
  RawSession,
} from '../domain/interfaces/cashier-dashboard.repository.interface.js';

const isSQLite = () => process.env.DATABASE_PROVIDER === 'sqlite';

@Injectable()
export class CashierDashboardRepository implements ICashierDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}
  // ── Agrégats journaliers des ventes ──────────────────────────────

  async getDaySales(userId: string, shopId: string, from: Date, to: Date): Promise<RawDaySales> {
    const where = {
      userId,
      shopId,
      createdAt: { gte: from, lte: to },
    };

    const [all, voided] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { ...where, status: { in: ['COMPLETED', 'PARTIALLY_PAID'] } },
        _sum: { totalAmount: true, discountAmount: true, changeAmount: true, paidAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.count({ where: { ...where, status: 'VOIDED' } }),
    ]);

    return {
      totalRevenue:    Number(all._sum.totalAmount   ?? 0),
      totalPaid:       Number(all._sum.paidAmount    ?? 0),
      totalDiscounts:  Number(all._sum.discountAmount ?? 0),
      totalChange:     Number(all._sum.changeAmount  ?? 0),
      transactionCount: all._count.id,
      voidedCount:     voided,
    };
  }

  // ── Répartition par mode de paiement ─────────────────────────────

  async getPaymentBreakdown(userId: string, shopId: string, from: Date, to: Date): Promise<RawPaymentBreakdown[]> {
    // Récupérer d'abord les IDs des ventes pour éviter l'ambiguïté de colonne dans le groupBy
    const sales = await this.prisma.sale.findMany({
      where: {
        userId,
        shopId,
        status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
        createdAt: { gte: from, lte: to },
      },
      select: { id: true },
    });

    const saleIds = sales.map((s) => s.id);
    if (saleIds.length === 0) return [];

    const payments = await this.prisma.salePayment.groupBy({
      by: ['method'],
      where: { saleId: { in: saleIds } },
      _sum:   { amount: true },
      _count: { id: true },
    });

    return payments.map((p) => ({
      method: p.method,
      amount: Number(p._sum.amount ?? 0),
      count:  p._count.id,
    }));
  }
  // ── Timeline par heure ────────────────────────────────────────────

  async getSalesTimeline(userId: string, shopId: string, from: Date, to: Date): Promise<RawTimelinePoint[]> {
    const sales = await this.prisma.sale.findMany({
      where: {
        userId,
        shopId,
        status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agréger par heure en mémoire (compatible PostgreSQL et SQLite)
    const hourMap = new Map<number, { revenue: number; count: number }>();
    for (const sale of sales) {
      const hour = isSQLite()
        ? sale.createdAt.getHours()
        : sale.createdAt.getUTCHours();
      if (!hourMap.has(hour)) hourMap.set(hour, { revenue: 0, count: 0 });
      const entry = hourMap.get(hour)!;
      entry.revenue += Number(sale.totalAmount);
      entry.count   += 1;
    }

    return [...hourMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, data]) => ({
        hour:             hour,
        revenue:          parseFloat(data.revenue.toFixed(2)),
        transactionCount: data.count,
      }));
  }

  // ── Dernières ventes ──────────────────────────────────────────────

  async getRecentSales(userId: string, shopId: string, from: Date, to: Date, limit: number): Promise<RawRecentSale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { userId, shopId, createdAt: { gte: from, lte: to } },
      include: {
        items:    { select: { id: true } },
        payments: { select: { method: true, amount: true }, orderBy: { amount: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return sales.map((s) => ({
      id:                   s.id,
      receiptNumber:        s.receiptNumber,
      totalAmount:          Number(s.totalAmount),
      status:               s.status,
      createdAt:            s.createdAt.toISOString(),
      itemCount:            s.items.length,
      primaryPaymentMethod: s.payments[0]?.method ?? 'CASH',
    }));
  }

  // ── Session de caisse active ──────────────────────────────────────

  async getActiveSession(userId: string, shopId: string): Promise<RawSession | null> {
    const session = await this.prisma.cashSession.findFirst({
      where: { userId, shopId },
      orderBy: { openedAt: 'desc' },
    });

    if (!session) return null;

    return {
      id:              session.id,
      openedAt:        session.openedAt,
      openingBalance:  Number(session.openingBalance),
      expectedBalance: session.expectedBalance ? Number(session.expectedBalance) : null,
      closingBalance:  session.closingBalance  ? Number(session.closingBalance)  : null,
      difference:      session.difference      ? Number(session.difference)      : null,
      closedAt:        session.closedAt,
    };
  }

  // ── Infos caissier ────────────────────────────────────────────────

  async getCashierInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, role: true },
    });
    if (!user) return null;
    return { name: user.name ?? '', username: user.username, role: user.role };
  }
}
