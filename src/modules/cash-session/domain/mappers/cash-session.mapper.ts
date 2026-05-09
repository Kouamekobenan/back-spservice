import { CashSession as PrismaCashSession } from '@prisma/client';
import { CashSession } from '../entities/cash-session.entity.js';
import { OpenCashSessionDto } from '../../application/dtos/open-cash-session.dto.js';

export class CashSessionMapper {
  toDomain(prismaCashSession: PrismaCashSession): CashSession {
    return new CashSession(
      prismaCashSession.id,
      prismaCashSession.shopId,
      prismaCashSession.userId,
      prismaCashSession.openingBalance,
      prismaCashSession.closingBalance,
      prismaCashSession.expectedBalance,
      prismaCashSession.difference,
      prismaCashSession.openedAt,
      prismaCashSession.closedAt,
      prismaCashSession.notes,
      prismaCashSession.syncStatus,
      prismaCashSession.localId,
    );
  }

  toPersistence(dto: OpenCashSessionDto): any {
    return {
      shopId: dto.shopId,
      userId: dto.userId,
      openingBalance: dto.openingBalance,
      notes: dto.notes,
    };
  }
}
