import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { CreatePurchaseOrderDto } from '../dtos/create-purchase-order.dto.js';
import { PurchaseOrderResponseDto } from '../dtos/purchase-order-response.dto.js';

@Injectable()
export class CreatePurchaseOrderUseCase {
  private readonly logger = new Logger(CreatePurchaseOrderUseCase.name);

  constructor(
    @Inject('IPurchaseOrderRepository')
    private readonly repository: IPurchaseOrderRepository,
  ) {}

  async execute(data: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    if (data.items.length === 0) {
      throw new BadRequestException('Le bon de commande doit contenir au moins un article.');
    }

    const orderNumber = await this.repository.generateOrderNumber(data.shopId);
    const order = await this.repository.create(data, orderNumber);
    
    return PurchaseOrderResponseDto.fromDomain(order);
  }
}
