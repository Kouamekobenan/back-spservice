import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChangeLogService } from './application/changelog.service.js';
import { GetSnapshotUseCase } from './application/use-cases/get-snapshot.use-case.js';
import { GetPullChangesUseCase } from './application/use-cases/get-pull-changes.use-case.js';
import { SyncController } from './presentation/controllers/sync.controller.js';

@Module({
  controllers: [SyncController],
  providers: [
    PrismaService,
    ChangeLogService,
    GetSnapshotUseCase,
    GetPullChangesUseCase,
  ],
  exports: [ChangeLogService],
})
export class SyncModule {}
