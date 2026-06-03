// ================================================================
// MODULE — SyncQueueModule
// Assemble les couches DDD et enregistre les providers NestJS.
// ================================================================

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure
import { PrismaSyncQueueRepository } from './infrastructure/sync-queue.repository.impl.js';

// Application — Use Cases
import { EnqueueSyncItemUseCase }   from './application/usecases/enqueue-sync-item.usecase.js';
import { GetSyncQueueUseCase }      from './application/usecases/get-sync-queue.usecase.js';
import { ProcessSyncQueueUseCase }  from './application/usecases/process-sync-queue.usecase.js';
import { RetryFailedItemsUseCase }  from './application/usecases/retry-failed-items.usecase.js';
import { ResolveConflictUseCase }   from './application/usecases/resolve-conflict.usecase.js';

// Presentation
import { SyncQueueController } from './presentation/controllers/sync-queue.controller.js';
import { SyncQueueScheduler }  from './presentation/schedulers/sync-queue.scheduler.js';

// Prisma
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SyncModule } from '../sync/sync.module.js';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    SyncModule,
  ],
  controllers: [SyncQueueController],
  providers: [
    // ── Repository (port → adapter) ──────────────────────────
    {
      provide:  'ISyncQueueRepository',
      useClass: PrismaSyncQueueRepository,
    },

    // L'implémentation concrète doit aussi être injectable directement
    // (utilisée par le scheduler pour deleteSyncedOlderThan)
    PrismaSyncQueueRepository,

    // ── Use Cases ─────────────────────────────────────────────
    EnqueueSyncItemUseCase,
    GetSyncQueueUseCase,
    ProcessSyncQueueUseCase,
    RetryFailedItemsUseCase,
    ResolveConflictUseCase,

    // ── Scheduler CRON ────────────────────────────────────────
    SyncQueueScheduler,
  ],
  exports: [
    // Exporté pour que d'autres modules puissent enqueuer des items
    EnqueueSyncItemUseCase,
    GetSyncQueueUseCase,
    'ISyncQueueRepository',
  ],
})
export class SyncQueueModule {}
