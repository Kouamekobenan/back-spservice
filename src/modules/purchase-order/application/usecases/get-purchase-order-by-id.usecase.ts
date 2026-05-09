import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { PurchaseOrderResponseDto } from '../dtos/purchase-order-response.dto.js';

@Injectable()
export class GetPurchaseOrderByIdUseCase {
  constructor(
    @Inject('IPurchaseOrderRepository')
    private readonly repository: IPurchaseOrderRepository,
  ) {}

  async execute(id: string): Promise<PurchaseOrderResponseDto> {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException(`Bon de commande ${id} non trouvé`);
    return PurchaseOrderResponseDto.fromDomain(order);
  }
}
