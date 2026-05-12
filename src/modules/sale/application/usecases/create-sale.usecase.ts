import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { CreateSaleDto } from '../dtos/create-sale.dto.js';
import { Sale } from '../../domain/entities/sale.entity.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction } from '@prisma/client';
@Injectable()
export class CreateSaleUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: CreateSaleDto): Promise<Sale> {
    // 1. Validation de base
    if (data.items.length === 0) {
      throw new BadRequestException('La vente doit contenir au moins un article.');
    }

    // 2. Génération du numéro de reçu
    const receiptNumber = await this.saleRepository.generateReceiptNumber(data.shopId);

    // 3. Création de la vente (Transaction atomique)
    const sale = await this.saleRepository.create(data, receiptNumber);

    // 4. Émission de l'événement d'audit
      this.eventEmitter.emit(
        'audit.created',
        new AuditEvent(
          AuditAction.CREATE,
          'Sale',
          sale.getId(),
          sale.getUserId(),
          sale.getShopId(),
          undefined,
          sale,
          undefined,
          undefined,
          `Vente effectuée - Reçu n° ${sale.getReceiptNumber()}`,
        ),
      );

    return sale;
  }
}
