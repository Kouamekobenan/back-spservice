import { Module } from '@nestjs/common';
import { CashSessionController } from './presentation/controllers/cash-session.controller.js';
import { OpenCashSessionUseCase } from './application/usecases/open-cash-session.usecase.js';
import { CloseCashSessionUseCase } from './application/usecases/close-cash-session.usecase.js';
import { GetActiveCashSessionUseCase } from './application/usecases/get-active-cash-session.usecase.js';
import { PrismaCashSessionRepository } from './infrastructure/repository/prisma-cash-session.repository.js';
import { CashSessionMapper } from './domain/mappers/cash-session.mapper.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [CashSessionController],
  providers: [
    PrismaService,
    CashSessionMapper,
    OpenCashSessionUseCase,
    CloseCashSessionUseCase,
    GetActiveCashSessionUseCase,
    {
      provide: 'ICashSessionRepository',
      useClass: PrismaCashSessionRepository,
    },
  ],
  exports: [OpenCashSessionUseCase, CloseCashSessionUseCase, GetActiveCashSessionUseCase],
})
export class CashSessionModule {}
