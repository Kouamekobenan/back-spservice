import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ICashSessionRepository } from '../../domain/interfaces/cash-session.repository.interface.js';
import { CloseCashSessionDto } from '../dtos/close-cash-session.dto.js';
import { CashSession } from '../../domain/entities/cash-session.entity.js';

@Injectable()
export class CloseCashSessionUseCase {
  constructor(
    @Inject('ICashSessionRepository')
    private readonly cashSessionRepository: ICashSessionRepository,
  ) {}

  async execute(id: string, data: CloseCashSessionDto): Promise<CashSession> {
    const session = await this.cashSessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException('Session de caisse non trouvée.');
    }

    if (!session.isActive()) {
      throw new BadRequestException('Cette session est déjà fermée.');
    }

    const expectedBalance = await this.cashSessionRepository.calculateExpectedBalance(id);

    return await this.cashSessionRepository.close(id, data, expectedBalance);
  }
}
