import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { VoidSaleDto } from '../dtos/void-sale.dto.js';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class VoidSaleUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(saleId: string, dto: VoidSaleDto): Promise<Sale> {
    // 1. Vérifier que la vente existe avant de déléguer au repository
    const existing = await this.saleRepository.findById(saleId);
    if (!existing) {
      throw new NotFoundException(`Vente ${saleId} non trouvée`);
    }

    // 2. Annulation atomique (validation du statut + restitution stock dans la transaction)
    const voided = await this.saleRepository.voidSale(saleId, dto.userId, dto.reason);

    // 3. Audit trail
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.VOID_SALE,
        'Sale',
        saleId,
        dto.userId,
        existing.getShopId(),
        { status: existing.getStatus(), receiptNumber: existing.getReceiptNumber() },
        { status: voided.getStatus() },
        undefined,
        undefined,
        `Annulation vente ${existing.getReceiptNumber()} — ${dto.reason}`,
      ),
    );
    return voided;
  }
}
