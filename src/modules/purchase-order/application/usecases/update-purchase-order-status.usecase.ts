import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { PurchaseOrderResponseDto } from '../dtos/purchase-order-response.dto.js';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class UpdatePurchaseOrderStatusUseCase {
  constructor(
    @Inject('IPurchaseOrderRepository')
    private readonly repository: IPurchaseOrderRepository,
  ) {}

  async execute(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrderResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Bon de commande ${id} non trouvé`);
    
    const updated = await this.repository.updateStatus(id, status);
    return PurchaseOrderResponseDto.fromDomain(updated);
  }
}
