import { Inject, Injectable } from '@nestjs/common';
import type { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { PurchaseOrderQueryDto } from '../dtos/purchase-order-query.dto.js';
import { PurchaseOrderResponseDto } from '../dtos/purchase-order-response.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class GetAllPurchaseOrdersUseCase {
  constructor(
    @Inject('IPurchaseOrderRepository')
    private readonly repository: IPurchaseOrderRepository,
  ) {}

  async execute(query: PurchaseOrderQueryDto): Promise<PaginatedResponseRepository<PurchaseOrderResponseDto>> {
    const result = await this.repository.findAll(query);
    return {
      ...result,
      data: result.data.map(o => PurchaseOrderResponseDto.fromDomain(o)),
    };
  }
}
