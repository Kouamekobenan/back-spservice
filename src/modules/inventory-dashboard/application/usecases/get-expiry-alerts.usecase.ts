import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  ExpiryAlertsQueryDto,
  ExpiryAlertsResponseDto,
  ExpiredProductItemDto,
  ExpiringSoonProductItemDto,
} from '../dtos/expiry-alerts.dto.js';

@Injectable()
export class GetExpiryAlertsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(shopId: string, query?: ExpiryAlertsQueryDto): Promise<ExpiryAlertsResponseDto> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, currency: true },
    });

    if (!shop) {
      throw new NotFoundException(`Boutique avec l'ID ${shopId} introuvable.`);
    }

    const now = new Date();
    const thresholdDays = Math.max(1, query?.thresholdDays ?? 30);
    const thresholdDate = new Date(now.getTime() + thresholdDays * 86_400_000);

    // Produits avec stock positif et date de péremption définie
    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        isActive: true,
        expiryDate: { not: null },
        stockQty: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        stockQty: true,
        buyingPrice: true,
        sellingPrice: true,
        expiryDate: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const expiredProducts: ExpiredProductItemDto[] = [];
    const expiringSoonProducts: ExpiringSoonProductItemDto[] = [];

    let expiredTotalUnits = 0;
    let expiredTotalLoss = 0;
    let expiringSoonTotalUnits = 0;
    let expiringSoonTotalValue = 0;

    for (const p of products) {
      if (!p.expiryDate) continue;

      const stock = Number(p.stockQty);
      const bPrice = Number(p.buyingPrice);
      const sPrice = Number(p.sellingPrice);
      const val = Math.round(stock * bPrice * 100) / 100;
      const diffMs = p.expiryDate.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / 86_400_000);

      if (p.expiryDate <= now) {
        // Produit déjà périmé
        const daysExpired = Math.abs(diffDays);
        expiredTotalUnits += stock;
        expiredTotalLoss += val;

        expiredProducts.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          barcode: p.barcode,
          categoryName: p.category?.name ?? null,
          stockQty: parseFloat(stock.toFixed(3)),
          buyingPrice: bPrice,
          sellingPrice: sPrice,
          totalLossValue: val,
          expiryDate: p.expiryDate,
          daysExpired,
        });
      } else if (p.expiryDate <= thresholdDate) {
        // Produit arrivant à expiration sous le seuil
        expiringSoonTotalUnits += stock;
        expiringSoonTotalValue += val;

        expiringSoonProducts.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          barcode: p.barcode,
          categoryName: p.category?.name ?? null,
          stockQty: parseFloat(stock.toFixed(3)),
          buyingPrice: bPrice,
          sellingPrice: sPrice,
          atRiskValue: val,
          expiryDate: p.expiryDate,
          daysRemaining: Math.max(0, diffDays),
        });
      }
    }

    return {
      shopId: shop.id,
      shopName: shop.name,
      currency: shop.currency,
      summary: {
        expiredCount: expiredProducts.length,
        expiredTotalUnits: parseFloat(expiredTotalUnits.toFixed(3)),
        expiredTotalLoss: Math.round(expiredTotalLoss * 100) / 100,
        expiringSoonCount: expiringSoonProducts.length,
        expiringSoonTotalUnits: parseFloat(expiringSoonTotalUnits.toFixed(3)),
        expiringSoonTotalValue: Math.round(expiringSoonTotalValue * 100) / 100,
      },
      expiredProducts,
      expiringSoonProducts,
      generatedAt: now,
    };
  }
}
