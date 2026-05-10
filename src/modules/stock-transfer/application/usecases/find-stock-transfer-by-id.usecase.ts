import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity.js';

@Injectable()
export class FindStockTransferByIdUseCase {
  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(id: string): Promise<StockTransfer> {
    const transfer = await this.stockTransferRepository.findById(id);
    if (!transfer) {
      throw new NotFoundException(`Transfert avec l'ID ${id} non trouvé.`);
    }
    return transfer;
  }
}
