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
    const session = await this.prisma.cashSession.findUnique({
      where: { id },
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

    const salesSum = await this.prisma.sale.aggregate({
      where: { cashSessionId: sessionId, status: 'COMPLETED' },
      _sum: { paidAmount: true },
    });

    const totalPaid = salesSum._sum.paidAmount ? Number(salesSum._sum.paidAmount) : 0;
    return Number(session.openingBalance) + totalPaid;
  }
}
