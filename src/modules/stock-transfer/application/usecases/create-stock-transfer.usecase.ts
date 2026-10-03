import {
  Inject,
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { CreateStockTransferDto, StockTransferItemDto } from '../dtos/create-stock-transfer.dto.js';
import { StockTransfer } from '../../domain/entities/stock-transfer.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction, Role } from '@prisma/client';

@Injectable()
export class CreateStockTransferUseCase {
  private readonly logger = new Logger(CreateStockTransferUseCase.name);

  constructor(
    @Inject('IStockTransferRepository')
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: CreateStockTransferDto): Promise<StockTransfer> {
    // 1. Boutiques distinctes
    if (data.fromShopId === data.toShopId) {
      throw new BadRequestException('La boutique source et destination doivent être différentes.');
    }

    // 2. Existence et statut des boutiques
    const [fromShop, toShop] = await Promise.all([
      this.prisma.shop.findUnique({ where: { id: data.fromShopId } }),
      this.prisma.shop.findUnique({ where: { id: data.toShopId } }),
    ]);
    if (!fromShop || !fromShop.isActive) {
      throw new BadRequestException('La boutique source est introuvable ou inactive.');
    }
    if (!toShop || !toShop.isActive) {
      throw new BadRequestException('La boutique de destination est introuvable ou inactive.');
    }

    // 3. Contrôle des droits d'accès de l'utilisateur sur la boutique source
    if (data.userId) {
      const hasAccess = await this.checkUserAccess(data.userId, data.fromShopId);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Vous n'avez pas l'autorisation d'initier un transfert de stock depuis "${fromShop.name}".`,
        );
      }
    }

    // 4. Validation des articles (non vide, quantité > 0, détection de doublons)
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Le transfert doit contenir au moins un produit.');
    }

    const consolidatedItems = new Map<string, { quantity: number; unitCost?: number }>();
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(`Quantité invalide (${item.quantity}) pour le produit ${item.productId}.`);
      }
      const existing = consolidatedItems.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        consolidatedItems.set(item.productId, { quantity: item.quantity, unitCost: item.unitCost });
      }
    }

    // 5. Vérification de l'existence, de l'appartenance et de la disponibilité du stock
    const productIds = Array.from(consolidatedItems.keys());
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits spécifiés sont introuvables.');
    }

    const validatedItems: StockTransferItemDto[] = [];
    for (const product of products) {
      if (product.shopId !== data.fromShopId) {
        throw new BadRequestException(`Le produit "${product.name}" n'appartient pas à la boutique source.`);
      }
      if (!product.isActive) {
        throw new BadRequestException(`Le produit "${product.name}" est inactif et ne peut pas être transféré.`);
      }
      const requestedQty = consolidatedItems.get(product.id)!.quantity;
      if (Number(product.stockQty) < requestedQty) {
        throw new BadRequestException(
          `Stock insuffisant pour "${product.name}" (Disponible: ${product.stockQty}, Requis: ${requestedQty}).`,
        );
      }

      validatedItems.push({
        productId: product.id,
        quantity: requestedQty,
        unitCost: consolidatedItems.get(product.id)!.unitCost ?? Number(product.buyingPrice),
      });
    }

    // 6. Génération du numéro de bordereau et création transactionnelle
    const transferNumber = await this.stockTransferRepository.generateTransferNumber(data.fromShopId);
    const transfer = await this.stockTransferRepository.create(
      {
        ...data,
        items: validatedItems,
      },
      transferNumber,
    );

    // 7. Émission de l'événement d'audit
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.CREATE,
        'StockTransfer',
        transfer.id,
        data.userId || 'SYSTEM',
        data.fromShopId,
        undefined,
        transfer,
        undefined,
        undefined,
        `Bordereau de transfert ${transfer.transferNumber} créé de "${fromShop.name}" vers "${toShop.name}" (${validatedItems.length} articles).`,
      ),
    );

    this.logger.log(`Transfert ${transfer.transferNumber} initié avec succès: ${data.fromShopId} -> ${data.toShopId}`);
    return transfer;
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
