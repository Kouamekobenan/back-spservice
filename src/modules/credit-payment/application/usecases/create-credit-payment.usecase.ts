import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { type ICreditPaymentRepository } from '../../domain/interfaces/credit-payment.interface.repository.js';
import { CreditPayment } from '../../domain/entities/credit-payment.entity.js';
import { CreateCreditPaymentDto } from '../dtos/create-credit-payment.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { CreditPaymentMapper } from '../../domain/mappers/credit-payment.mapper.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditAction } from '@prisma/client';
import { AuditEvent } from '../../../../common/events/audit.event.js';
@Injectable()
export class CreateCreditPaymentUseCase {
  constructor(
    @Inject('ICreditPaymentRepository')
    private readonly paymentRepository: ICreditPaymentRepository,
    private readonly prisma: PrismaService,
    private readonly mapper: CreditPaymentMapper,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: CreateCreditPaymentDto): Promise<CreditPayment> {
    // 1. Vérifier si le client existe
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Client avec l'ID ${data.customerId} non trouvé`,
      );
    }

    // 2. Vérifier que le montant du paiement ne dépasse pas la dette
    if (data.amount > Number(customer.totalDebt)) {
      throw new BadRequestException(
        `Le montant du paiement (${data.amount}) ne peut pas dépasser la dette totale du client (${customer.totalDebt})`,
      );
    }
    try {
      // 3. Transaction atomique : Création du paiement + Mise à jour de la dette
      const result = await this.prisma.$transaction(async (tx) => {
        // Créer le paiement
        const payment = await tx.creditPayment.create({
          data: {
            customerId: data.customerId,
            amount: data.amount,
            method: data.method,
            reference: data.reference,
            notes: data.notes,
            localId: data.localId,
          },
        });
        // AUDIT
         this.eventEmitter.emit(
           'audit.updated',
           new AuditEvent(
             AuditAction.CREATE,
             'Credit',
             result.id,
             data.reference || 'system-user',
             data.customerId,
             result,
             payment,
             undefined,
             undefined,
             `Paiement crédit : ${result.method} avec une somme de: ${result.amount}`,
           ),
         );
        // Mettre à jour la dette du client (soustraction)
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalDebt: {
              decrement: data.amount,
            },
          },
        });

        return payment;
      });

      return this.mapper.toApplication(result);
    } catch (error) {
      console.error('Erreur lors du traitement du paiement à crédit', error);
      throw error;
    }
  }
}
