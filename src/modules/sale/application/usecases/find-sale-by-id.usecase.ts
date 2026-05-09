import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class FindSaleByIdUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      throw new NotFoundException(`Vente avec l'ID ${id} non trouvée.`);
    }
    return sale;
  }
}
