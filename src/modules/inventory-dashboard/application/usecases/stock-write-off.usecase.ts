import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction, Role, StockMovementReason } from '@prisma/client';
import {
  StockWriteOffDto,
  StockWriteOffResponseDto,
  WrittenOffItemDetailDto,
} from '../dtos/stock-write-off.dto.js';

@Injectable()
export class StockWriteOffUseCase {
  private readonly logger = new Logger(StockWriteOffUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: StockWriteOffDto): Promise<StockWriteOffResponseDto> {
    // 1. Contrôle boutique
    const shop = await this.prisma.shop.findUnique({
      where: { id: data.shopId },
      select: { id: true, name: true, currency: true, isActive: true },
    });

    if (!shop || !shop.isActive) {
      throw new NotFoundException(`Boutique avec l'ID ${data.shopId} introuvable ou inactive.`);
    }

    // 2. Contrôle habilitations
    if (data.userId) {
      const hasAccess = await this.checkUserAccess(data.userId, data.shopId);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Vous n'avez pas l'autorisation d'effectuer une mise au rebut sur la boutique "${shop.name}".`,
        );
      }
    }

    // 3. Validation de la liste
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La liste des produits à déclasser ne peut pas être vide.');
    }

    // Consolidation des doublons par sommation
    const consolidatedMap = new Map<string, { quantity: number; notes?: string }>();
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('La quantité à déclasser doit être strictement positive (> 0).');
      }
      if (consolidatedMap.has(item.productId)) {
        const existing = consolidatedMap.get(item.productId)!;
        existing.quantity += item.quantity;
        if (item.notes) existing.notes = (existing.notes ? existing.notes + ' | ' : '') + item.notes;
      } else {
        consolidatedMap.set(item.productId, { quantity: item.quantity, notes: item.notes });
      }
    }

    const productIds = Array.from(consolidatedMap.keys());

    // 4. Récupération des produits en base
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId: data.shopId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        stockQty: true,
        buyingPrice: true,
        shopId: true,
      },
    });

    const productMap = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    // Contrôles de cohérence et disponibilité du stock
    for (const [productId, item] of consolidatedMap.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new BadRequestException(
          `Le produit ${productId} n'existe pas dans la boutique "${shop.name}".`,
        );
      }
      const available = Number(product.stockQty);
      if (item.quantity > available) {
        throw new BadRequestException(
          `Stock insuffisant pour déclasser "${product.name}". Demandé: ${item.quantity}, Disponible: ${available}.`,
        );
      }
    }

    // 5. Exécution transactionnelle de la mise au rebut
    const details: WrittenOffItemDetailDto[] = [];
    let totalUnitsWrittenOff = 0;
    let totalLossValue = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const [productId, item] of consolidatedMap.entries()) {
        const prod = productMap.get(productId)!;
        const currentStock = Number(prod.stockQty);
        const qtyToWriteOff = item.quantity;
        const newStock = currentStock - qtyToWriteOff;
        const bPrice = Number(prod.buyingPrice);
        const lossVal = Math.round(qtyToWriteOff * bPrice * 100) / 100;

        // Décrémenter le stock
        await tx.product.update({
          where: { id: prod.id },
          data: { stockQty: newStock },
        });

        const movementNotes = `[Mise au rebut - ${data.lossReason}] ${
          item.notes || data.notes || 'Déclassement de stock pour perte/avarie'
        }`;

        // Enregistrer le mouvement de perte
        const movement = await tx.stockMovement.create({
          data: {
            productId: prod.id,
            shopId: data.shopId,
            userId: data.userId || 'SYSTEM',
            reason: StockMovementReason.LOSS,
            quantity: qtyToWriteOff,
            stockBefore: currentStock,
            stockAfter: newStock,
            unitCost: prod.buyingPrice,
            notes: movementNotes,
          },
        });

        // Journal d'audit
        await tx.auditLog.create({
          data: {
            action: AuditAction.STOCK_ADJUSTMENT,
            entityType: 'Product',
            entityId: prod.id,
            userId: data.userId || null,
            shopId: data.shopId,
            dataBefore: {
              stockQty: currentStock,
              buyingPrice: bPrice,
            },
            dataAfter: {
              stockQty: newStock,
              writtenOff: qtyToWriteOff,
              lossValue: lossVal,
              lossReason: data.lossReason,
            },
            notes: movementNotes,
          },
        });

        totalUnitsWrittenOff += qtyToWriteOff;
        totalLossValue += lossVal;

        details.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          quantityWrittenOff: parseFloat(qtyToWriteOff.toFixed(3)),
          unitCost: bPrice,
          totalLossValue: lossVal,
          stockBefore: currentStock,
          stockAfter: newStock,
          movementId: movement.id,
        });
      }
    });

    // 6. Événement d'audit global
    this.eventEmitter.emit(
      'audit.created',
      new AuditEvent(
        AuditAction.STOCK_ADJUSTMENT,
        'StockWriteOff',
        data.shopId,
        data.userId || 'SYSTEM',
        data.shopId,
        undefined,
        {
          lossReason: data.lossReason,
          totalProductsCount: details.length,
          totalUnitsWrittenOff,
          totalLossValue,
        },
        undefined,
        undefined,
        `Mise au rebut [${data.lossReason}] validée pour "${shop.name}": ` +
          `${totalUnitsWrittenOff} unité(s) pour une perte de ${totalLossValue} ${shop.currency}.`,
      ),
    );

    this.logger.log(
      `Mise au rebut effectuée avec succès pour "${shop.name}": ${totalUnitsWrittenOff} articles, perte: ${totalLossValue} ${shop.currency}`,
    );

    return {
      shopId: shop.id,
      shopName: shop.name,
      currency: shop.currency,
      lossReason: data.lossReason,
      totalProductsCount: details.length,
      totalUnitsWrittenOff: parseFloat(totalUnitsWrittenOff.toFixed(3)),
      totalLossValue: Math.round(totalLossValue * 100) / 100,
      items: details,
      executedAt: new Date(),
    };
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
