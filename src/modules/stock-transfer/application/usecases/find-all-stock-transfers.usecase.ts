import { Inject, Injectable } from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity.js';
import { FilterStockTransferDto } from '../dtos/filter-stock-transfer.dto.js';

@Injectable()
export class FindAllStockTransfersUseCase {
  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(filters: FilterStockTransferDto): Promise<StockTransfer[]> {
    return await this.stockTransferRepository.findAll(filters);
  }
}
