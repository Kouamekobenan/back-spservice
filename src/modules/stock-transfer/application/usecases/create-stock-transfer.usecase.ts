import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { CreateStockTransferDto } from '../dtos/create-stock-transfer.dto.js';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity.js';

@Injectable()
export class CreateStockTransferUseCase {
  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
  ) {}

  async execute(data: CreateStockTransferDto): Promise<StockTransfer> {
    if (data.fromShopId === data.toShopId) {
      throw new BadRequestException('La boutique source et destination doivent être différentes.');
    }

    if (data.items.length === 0) {
      throw new BadRequestException('Le transfert doit contenir au moins un produit.');
    }

    const transferNumber = await this.stockTransferRepository.generateTransferNumber(data.fromShopId);
    return await this.stockTransferRepository.create(data, transferNumber);
  }
}
