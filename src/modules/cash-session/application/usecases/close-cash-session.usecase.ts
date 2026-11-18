import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import type { ICashSessionRepository } from '../../domain/interfaces/cash-session.repository.interface.js';
import { CloseCashSessionDto } from '../dtos/close-cash-session.dto.js';
import { CashSession } from '../../domain/entities/cash-session.entity.js';
import { ProcessSyncQueueUseCase } from '../../../sync-queue/application/usecases/process-sync-queue.usecase.js';

@Injectable()
export class CloseCashSessionUseCase {
  private readonly logger = new Logger(CloseCashSessionUseCase.name);

  constructor(
    @Inject('ICashSessionRepository')
    private readonly cashSessionRepository: ICashSessionRepository,
    private readonly processSyncQueueUseCase: ProcessSyncQueueUseCase,
  ) {}

  async execute(id: string, data: CloseCashSessionDto): Promise<CashSession> {
    // 1. Traiter d'abord les éléments en attente dans la SyncQueue (sessions et ventes hors-ligne)
    // afin que toutes les ventes de la session soient comptabilisées avant la clôture.
    try {
      await this.processSyncQueueUseCase.execute(100);
    } catch (err) {
      this.logger.warn('Impossible de vider la SyncQueue avant fermeture de caisse', err);
    }

    const session = await this.cashSessionRepository.findById(id);

    if (!session) {
      throw new NotFoundException('Session de caisse non trouvée.');
    }

    if (!session.isActive()) {
      throw new BadRequestException('Cette session est déjà fermée.');
    }

    const sessionId = session.getId();
    const expectedBalance = await this.cashSessionRepository.calculateExpectedBalance(sessionId);

    return await this.cashSessionRepository.close(sessionId, data, expectedBalance);
  }
}
