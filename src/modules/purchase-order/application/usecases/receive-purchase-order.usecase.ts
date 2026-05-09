import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { PurchaseOrderResponseDto } from '../dtos/purchase-order-response.dto.js';
import { ReceiveItemsDto } from '../dtos/receive-items.dto.js';

@Injectable()
export class ReceivePurchaseOrderUseCase {
  constructor(
    @Inject('IPurchaseOrderRepository')
    private readonly repository: IPurchaseOrderRepository,
  ) {}

  async execute(id: string, data: ReceiveItemsDto, userId: string): Promise<PurchaseOrderResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Bon de commande ${id} non trouvé`);
    
    const updated = await this.repository.receiveItems(id, data, userId);
    return PurchaseOrderResponseDto.fromDomain(updated);
  }
}
