import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { CreateSaleDto } from '../dtos/create-sale.dto.js';
import { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(data: CreateSaleDto): Promise<Sale> {
    // 1. Validation de base
    if (data.items.length === 0) {
      throw new BadRequestException('La vente doit contenir au moins un article.');
    }

    // 2. Génération du numéro de reçu
    const receiptNumber = await this.saleRepository.generateReceiptNumber(data.shopId);

    // 3. Création de la vente (Transaction atomique)
    return await this.saleRepository.create(data, receiptNumber);
  }
}
