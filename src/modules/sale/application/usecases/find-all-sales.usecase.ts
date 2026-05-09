import { Inject, Injectable } from '@nestjs/common';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class FindAllSalesUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(filters: { shopId: string }): Promise<Sale[]> {
    return await this.saleRepository.findAll(filters);
  }
}
