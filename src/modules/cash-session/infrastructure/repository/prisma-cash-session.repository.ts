import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ICashSessionRepository } from '../../domain/interfaces/cash-session.repository.interface.js';
import { CashSession } from '../../domain/entities/cash-session.entity.js';
import { OpenCashSessionDto } from '../../application/dtos/open-cash-session.dto.js';
import { CloseCashSessionDto } from '../../application/dtos/close-cash-session.dto.js';
import { CashSessionMapper } from '../../domain/mappers/cash-session.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class PrismaCashSessionRepository implements ICashSessionRepository {
  private readonly logger = new Logger(PrismaCashSessionRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CashSessionMapper,
  ) {}

  async create(data: OpenCashSessionDto): Promise<CashSession> {
    try {
      const session = await this.prisma.cashSession.create({
        data: {
          shopId: data.shopId,
          userId: data.userId,
          openingBalance: data.openingBalance,
          notes: data.notes,
        },
      });
      return this.mapper.toDomain(session);
    } catch (error) {
      this.logger.error('Error opening cash session', error);
      throw new InternalServerErrorException('Impossible d’ouvrir la session de caisse');
    }
  }

  async findById(id: string): Promise<CashSession | null> {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        OR: [{ id }, { localId: id }],
      },
    });
    return session ? this.mapper.toDomain(session) : null;
  }

  async findActiveByUserId(userId: string): Promise<CashSession | null> {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        userId,
        closedAt: null,
      },
    });
    return session ? this.mapper.toDomain(session) : null;
  }

  async findActiveByShopId(shopId: string): Promise<CashSession | null> {
    const session = await this.prisma.cashSession.findFirst({
      where: {
        shopId,
        closedAt: null,
      },
    });
    return session ? this.mapper.toDomain(session) : null;
  }

  async close(id: string, data: CloseCashSessionDto, expectedBalance: number): Promise<CashSession> {
    try {
      const difference = data.closingBalance - expectedBalance;
      const session = await this.prisma.cashSession.update({
        where: { id },
        data: {
          closingBalance: data.closingBalance,
          closedAt: new Date(),
          expectedBalance,
          difference,
          notes: data.notes,
        },
      });
      return this.mapper.toDomain(session);
    } catch (error) {
      this.logger.error('Error closing cash session', error);
      throw new InternalServerErrorException('Impossible de fermer la session de caisse');
    }
  }

  async findAllByShopId(shopId: string): Promise<CashSession[]> {
    const sessions = await this.prisma.cashSession.findMany({
      where: { shopId },
      orderBy: { openedAt: 'desc' },
    });
    return sessions.map((s) => this.mapper.toDomain(s));
  }

  async calculateExpectedBalance(sessionId: string): Promise<number> {
    const session = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
      select: { openingBalance: true },
    });

    if (!session) return 0;

    // 1. Ventes valides (COMPLETED ou PARTIALLY_PAID) : uniquement les espèces (CASH) nettes du rendu monnaie
    const activeSales = await this.prisma.sale.findMany({
      where: {
        cashSessionId: sessionId,
        status: { in: ['COMPLETED', 'PARTIALLY_PAID'] },
      },
      select: {
        changeAmount: true,
        payments: {
          where: { method: 'CASH' },
          select: { amount: true },
        },
      },
    });

    const totalCashIn = activeSales.reduce((sum, sale) => {
      const cashReceived = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
      if (cashReceived <= 0) return sum;
      const netCash = Math.max(0, cashReceived - Number(sale.changeAmount ?? 0));
      return sum + netCash;
    }, 0);

    // 2. Ventes remboursées (REFUNDED) rattachées à la session : déduire les remboursements en espèces (CASH)
    const refundedSales = await this.prisma.sale.findMany({
      where: {
        cashSessionId: sessionId,
        status: 'REFUNDED',
      },
      select: {
        payments: {
          where: { method: 'CASH' },
          select: { amount: true },
        },
      },
    });

    const totalCashRefunded = refundedSales.reduce((sum, sale) => {
      const cashOut = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + cashOut;
    }, 0);

    return Number(session.openingBalance) + totalCashIn - totalCashRefunded;
  }
}
