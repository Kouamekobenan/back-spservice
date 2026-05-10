import { Module } from '@nestjs/common';
import { StockTransferController } from './presentation/stock-transfer.controller.js';
import { CreateStockTransferUseCase } from './application/usecases/create-stock-transfer.usecase.js';
import { UpdateStockTransferStatusUseCase } from './application/usecases/update-stock-transfer-status.usecase.js';
import { FindAllStockTransfersUseCase } from './application/usecases/find-all-stock-transfers.usecase.js';
import { FindStockTransferByIdUseCase } from './application/usecases/find-stock-transfer-by-id.usecase.js';
import { StockTransferMapper } from './domain/mappers/stock-transfer.mapper.js';
import { PrismaStockTransferRepository } from './infrastructure/repository/prisma-stock-transfer.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [StockTransferController],
  providers: [
    CreateStockTransferUseCase,
    UpdateStockTransferStatusUseCase,
    FindAllStockTransfersUseCase,
    FindStockTransferByIdUseCase,
    StockTransferMapper,
    {
      provide: 'IStockTransferRepository',
      useClass: PrismaStockTransferRepository,
    },
  ],
  exports: [
    CreateStockTransferUseCase,
    UpdateStockTransferStatusUseCase,
    FindAllStockTransfersUseCase,
    FindStockTransferByIdUseCase,
  ],
})
export class StockTransferModule {}
