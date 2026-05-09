import { Inject, Injectable } from '@nestjs/common';
import type { ICashSessionRepository } from '../../domain/interfaces/cash-session.repository.interface.js';
import { CashSession } from '../../domain/entities/cash-session.entity.js';

@Injectable()
export class GetActiveCashSessionUseCase {
  constructor(
    @Inject('ICashSessionRepository')
    private readonly cashSessionRepository: ICashSessionRepository,
  ) {}

  async execute(userId: string): Promise<CashSession | null> {
    return await this.cashSessionRepository.findActiveByUserId(userId);
  }
}
