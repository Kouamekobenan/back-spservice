import { CashSession } from '../entities/cash-session.entity.js';
import { OpenCashSessionDto } from '../../application/dtos/open-cash-session.dto.js';
import { CloseCashSessionDto } from '../../application/dtos/close-cash-session.dto.js';

export interface ICashSessionRepository {
  create(data: OpenCashSessionDto): Promise<CashSession>;
  findById(id: string): Promise<CashSession | null>;
  findActiveByUserId(userId: string): Promise<CashSession | null>;
  findActiveByShopId(shopId: string): Promise<CashSession | null>;
  close(id: string, data: CloseCashSessionDto, expectedBalance: number): Promise<CashSession>;
  findAllByShopId(shopId: string): Promise<CashSession[]>;
  calculateExpectedBalance(sessionId: string): Promise<number>;
}
