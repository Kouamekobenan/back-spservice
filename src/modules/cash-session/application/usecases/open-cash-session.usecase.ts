import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { ICashSessionRepository } from '../../domain/interfaces/cash-session.repository.interface.js';
import { OpenCashSessionDto } from '../dtos/open-cash-session.dto.js';
import { CashSession } from '../../domain/entities/cash-session.entity.js';

@Injectable()
export class OpenCashSessionUseCase {
  constructor(
    @Inject('ICashSessionRepository')
    private readonly cashSessionRepository: ICashSessionRepository,
  ) {}

  async execute(data: OpenCashSessionDto): Promise<CashSession> {
    const activeSession = await this.cashSessionRepository.findActiveByUserId(data.userId);
    
    if (activeSession) {
      throw new ConflictException('Une session de caisse est déjà ouverte pour cet utilisateur.');
    }

    return await this.cashSessionRepository.create(data);
  }
}
