import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { UpdateStockTransferStatusDto } from '../dtos/update-stock-transfer-status.dto.js';
import { StockTransfer, StockTransferStatus } from '../../domain/entities/stock-transfer.entity.js';

@Injectable()
export class UpdateStockTransferStatusUseCase {
  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(id: string, data: UpdateStockTransferStatusDto): Promise<StockTransfer> {
    const transfer = await this.stockTransferRepository.findById(id);
    if (!transfer) {
      throw new NotFoundException(`Transfert avec l'ID ${id} non trouvé.`);
    }

    if (transfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException(`Impossible de modifier un transfert qui n'est pas en attente (Statut actuel: ${transfer.status}).`);
    }

    return await this.stockTransferRepository.updateStatus(id, data.status, data.userId);
  }
}
