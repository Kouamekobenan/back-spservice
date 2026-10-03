import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { UpdateStockTransferStatusDto } from '../dtos/update-stock-transfer-status.dto.js';
import { StockTransfer, StockTransferStatus } from '../../domain/entities/stock-transfer.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction, Role } from '@prisma/client';

@Injectable()
export class UpdateStockTransferStatusUseCase {
  private readonly logger = new Logger(UpdateStockTransferStatusUseCase.name);

  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(id: string, data: UpdateStockTransferStatusDto): Promise<StockTransfer> {
    const transfer = await this.stockTransferRepository.findById(id);
    if (!transfer) {
      throw new NotFoundException(`Transfert avec l'ID ${id} non trouvé.`);
    }

    if (transfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException(
        `Impossible de modifier un transfert qui n'est pas en attente (Statut actuel: ${transfer.status}).`,
      );
    }

    // ─── Contrôle des permissions selon le statut cible ───
    if (data.userId) {
      if (data.status === StockTransferStatus.COMPLETED) {
        // Seule la boutique de destination (ou SUPER_ADMIN) valide la réception
        const hasDestAccess = await this.checkUserAccess(data.userId, transfer.toShopId);
        if (!hasDestAccess) {
          throw new ForbiddenException(
            "Seul un gestionnaire assigné à la boutique de destination peut réceptionner et valider ce transfert.",
          );
        }
      } else if (data.status === StockTransferStatus.CANCELLED) {
        // L'expéditeur, le destinataire (ou SUPER_ADMIN) peut annuler un transfert en attente
        const [hasSourceAccess, hasDestAccess] = await Promise.all([
          this.checkUserAccess(data.userId, transfer.fromShopId),
          this.checkUserAccess(data.userId, transfer.toShopId),
        ]);
        if (!hasSourceAccess && !hasDestAccess) {
          throw new ForbiddenException("Vous n'avez pas l'autorisation d'annuler ce transfert.");
        }
      }
    }

    const updatedTransfer = await this.stockTransferRepository.updateStatus(id, data.status, data.userId || 'SYSTEM');

    // ─── Émission de l'événement d'audit ───
    const auditShopId = data.status === StockTransferStatus.COMPLETED ? transfer.toShopId : transfer.fromShopId;
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.UPDATE,
        'StockTransfer',
        id,
        data.userId || 'SYSTEM',
        auditShopId,
        transfer,
        updatedTransfer,
        undefined,
        undefined,
        `Statut du bordereau de transfert ${transfer.transferNumber} mis à jour : ${transfer.status} -> ${data.status}.`,
      ),
    );

    this.logger.log(`Transfert ${transfer.transferNumber} mis à jour vers ${data.status} par ${data.userId || 'SYSTEM'}`);
    return updatedTransfer;
  }

  private async checkUserAccess(userId: string, shopId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return false;
    if (user.role === Role.SUPER_ADMIN) return true;

    const access = await this.prisma.userShopAccess.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });
    return !!access;
  }
}
