import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { RefundSaleDto } from '../dtos/refund-sale.dto.js';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { Sale } from '../../domain/entities/sale.entity.js';

@Injectable()
export class RefundSaleUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(saleId: string, dto: RefundSaleDto): Promise<Sale> {
    // 1. Vérifier que la vente originale existe
    const original = await this.saleRepository.findById(saleId);
    if (!original) {
      throw new NotFoundException(`Vente ${saleId} non trouvée`);
    }

    // 2. Générer le numéro de reçu du remboursement
    const receiptNumber = await this.saleRepository.generateReceiptNumber(original.getShopId());

    // 3. Création du remboursement (atomique : nouvelle vente + mouvements stock + dette)
    const refund = await this.saleRepository.refundSale(saleId, dto, receiptNumber);

    // 4. Audit trail
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.VOID_SALE,
        'Sale',
        refund.getId(),
        dto.userId,
        original.getShopId(),
        { originalSaleId: saleId, receiptNumber: original.getReceiptNumber() },
        {
          refundReceiptNumber: refund.getReceiptNumber(),
          totalAmount:         refund.getTotalAmount(),
          returnToStock:       dto.returnToStock,
        },
        undefined,
        undefined,
        `Remboursement vente ${original.getReceiptNumber()} — ${dto.reason}`,
      ),
    );

    return refund;
  }
}
