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
  AdjustDiscrepanciesDto,
  AdjustDiscrepanciesResponseDto,
  DiscrepancyDetailDto,
  DiscrepancyItemDto,
} from '../dtos/adjust-discrepancies.dto.js';

@Injectable()
export class AdjustDiscrepanciesUseCase {
  private readonly logger = new Logger(AdjustDiscrepanciesUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: AdjustDiscrepanciesDto): Promise<AdjustDiscrepanciesResponseDto> {
    // 1. Vérification de l'existence et du statut de la boutique
    const shop = await this.prisma.shop.findUnique({
      where: { id: data.shopId },
      select: { id: true, name: true, currency: true, isActive: true },
    });

    if (!shop || !shop.isActive) {
      throw new NotFoundException(`Boutique avec l'ID ${data.shopId} introuvable ou inactive.`);
    }

    // 2. Vérification des habilitations utilisateur sur cette boutique
    if (data.userId) {
      const hasAccess = await this.checkUserAccess(data.userId, data.shopId);
      if (!hasAccess) {
        throw new ForbiddenException(
          `Vous n'avez pas l'autorisation d'ajuster l'inventaire physique de la boutique "${shop.name}".`,
        );
      }
    }

    // 3. Validation de la liste des articles
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException("La liste des produits à ajuster ne peut pas être vide.");
    }

    // Déduplication : en cas de saisie multiple pour le même produit, on retient le dernier comptage
    const consolidatedMap = new Map<string, DiscrepancyItemDto>();
    for (const item of data.items) {
      consolidatedMap.set(item.productId, item);
    }

    const productIds = Array.from(consolidatedMap.keys());

    // 4. Récupération des produits cibles en base pour la boutique concernée
    const existingProducts = await this.prisma.product.findMany({
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
        sellingPrice: true,
        shopId: true,
        isActive: true,
      },
    });

    const productMap = new Map<string, (typeof existingProducts)[number]>();
    for (const p of existingProducts) {
      productMap.set(p.id, p);
    }

    // Vérifier si des produits demandés n'existent pas ou n'appartiennent pas à la boutique
    for (const productId of productIds) {
      if (!productMap.has(productId)) {
        throw new BadRequestException(
          `Le produit avec l'ID ${productId} n'existe pas dans la boutique "${shop.name}".`,
        );
      }
    }

    // 5. Exécution transactionnelle de l'ajustement
    const details: DiscrepancyDetailDto[] = [];
    let adjustedCount = 0;
    let unchangedCount = 0;
    let totalDiscrepancyQuantity = 0;
    let totalDiscrepancyValue = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of consolidatedMap.values()) {
        const prod = productMap.get(item.productId)!;
        const currentStock = Number(prod.stockQty);
        const countedStock = Number(item.countedQuantity);
        const discrepancy = countedStock - currentStock;
        const buyingPrice = Number(prod.buyingPrice);
        const discrepancyValue = Math.round(discrepancy * buyingPrice * 100) / 100;

        if (discrepancy === 0) {
          unchangedCount++;
          details.push({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            barcode: prod.barcode,
            stockBefore: currentStock,
            stockAfter: currentStock,
            discrepancy: 0,
            discrepancyValue: 0,
            status: 'MATCH',
          });
          continue;
        }

        // Mise à jour de la quantité physique en stock
        await tx.product.update({
          where: { id: prod.id },
          data: { stockQty: countedStock },
        });

        // Détermination du motif de mouvement
        const reason =
          discrepancy < 0 ? StockMovementReason.LOSS : StockMovementReason.ADJUSTMENT;

        const movementNotes = item.notes
          ? `${item.notes} (Écart: ${discrepancy > 0 ? '+' : ''}${discrepancy})`
          : (data.notes
              ? `${data.notes} — Écart: ${discrepancy > 0 ? '+' : ''}${discrepancy}`
              : `Ajustement inventaire: ${discrepancy > 0 ? '+' : ''}${discrepancy}`);

        // Création de la trace du mouvement de stock
        const movement = await tx.stockMovement.create({
          data: {
            productId: prod.id,
            shopId: data.shopId,
            userId: data.userId || 'SYSTEM',
            reason,
            quantity: Math.abs(discrepancy),
            stockBefore: currentStock,
            stockAfter: countedStock,
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
              buyingPrice,
            },
            dataAfter: {
              stockQty: countedStock,
              discrepancy,
              discrepancyValue,
              reason,
            },
            notes: movementNotes,
          },
        });

        adjustedCount++;
        totalDiscrepancyQuantity += discrepancy;
        totalDiscrepancyValue += discrepancyValue;

        details.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          stockBefore: currentStock,
          stockAfter: countedStock,
          discrepancy: parseFloat(discrepancy.toFixed(3)),
          discrepancyValue,
          status: discrepancy > 0 ? 'SURPLUS' : 'DEFICIT',
          movementId: movement.id,
        });
      }
    });

    // 6. Émission d'un événement d'audit global pour la session d'inventaire
    if (adjustedCount > 0) {
      this.eventEmitter.emit(
        'audit.created',
        new AuditEvent(
          AuditAction.STOCK_ADJUSTMENT,
          'InventorySession',
          data.shopId,
          data.userId || 'SYSTEM',
          data.shopId,
          undefined,
          {
            adjustedCount,
            unchangedCount,
            totalDiscrepancyQuantity,
            totalDiscrepancyValue,
          },
          undefined,
          undefined,
          `Ajustement d'inventaire physique effectué pour "${shop.name}": ${adjustedCount} produit(s) régularisé(s), valeur nette ${totalDiscrepancyValue} ${shop.currency}.`,
        ),
      );
    }

    this.logger.log(
      `Ajustement d'inventaire réussi pour la boutique "${shop.name}" (${data.shopId}): ` +
        `${adjustedCount} ajustés, ${unchangedCount} inchangés, valeur: ${totalDiscrepancyValue} ${shop.currency}`,
    );

    return {
      shopId: shop.id,
      shopName: shop.name,
      currency: shop.currency,
      adjustedCount,
      unchangedCount,
      totalDiscrepancyQuantity: parseFloat(totalDiscrepancyQuantity.toFixed(3)),
      totalDiscrepancyValue: Math.round(totalDiscrepancyValue * 100) / 100,
      details,
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
