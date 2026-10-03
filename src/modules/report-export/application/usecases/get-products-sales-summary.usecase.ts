import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  ProductsSummaryQueryDto,
  ProductsSummaryResponseDto,
  ProductSummaryItemDto,
} from '../dtos/products-summary-query.dto.js';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class GetProductsSalesSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ProductsSummaryQueryDto): Promise<ProductsSummaryResponseDto> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: query.shopId },
      select: { id: true, name: true, currency: true },
    });

    if (!shop) {
      throw new NotFoundException(`Boutique avec l'ID ${query.shopId} introuvable.`);
    }

    const now = new Date();
    const from = query.fromDate
      ? new Date(query.fromDate)
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Début du mois en cours
    const to = query.toDate
      ? new Date(query.toDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // Fin de journée

    // Récupérer les articles des ventes complétées sur la période
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          shopId: query.shopId,
          status: SaleStatus.COMPLETED,
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      },
      select: {
        productId: true,
        productName: true,
        productSku: true,
        quantity: true,
        totalPrice: true,
        saleId: true,
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            sku: true,
            buyingPrice: true,
            sellingPrice: true,
            stockQty: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Agrégation par produit
    const aggregatedMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        barcode: string | null;
        sku: string | null;
        categoryId: string | null;
        categoryName: string | null;
        currentStock: number;
        buyingPrice: number;
        sellingPrice: number;
        unitsSold: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
        marginRate: number;
        saleIds: Set<string>;
      }
    >();

    for (const item of saleItems) {
      const pid = item.productId;
      if (!aggregatedMap.has(pid)) {
        const prod = item.product;
        const bPrice = prod ? Number(prod.buyingPrice) : 0;
        const sPrice = prod ? Number(prod.sellingPrice) : 0;
        aggregatedMap.set(pid, {
          productId: pid,
          productName: prod?.name || item.productName,
          barcode: prod?.barcode ?? null,
          sku: prod?.sku ?? item.productSku ?? null,
          categoryId: prod?.categoryId ?? null,
          categoryName: prod?.category?.name ?? null,
          currentStock: prod ? Number(prod.stockQty) : 0,
          buyingPrice: bPrice,
          sellingPrice: sPrice,
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          marginRate: 0,
          saleIds: new Set(),
        });
      }

      const entry = aggregatedMap.get(pid)!;
      const qty = Number(item.quantity);
      const rev = Number(item.totalPrice);
      entry.unitsSold += qty;
      entry.revenue += rev;
      entry.cogs += qty * entry.buyingPrice;
      entry.saleIds.add(item.saleId);
    }

    // Calcul de la marge par produit
    let allItems: ProductSummaryItemDto[] = Array.from(aggregatedMap.values()).map((p) => {
      const grossProfit = p.revenue - p.cogs;
      const marginRate = p.revenue > 0 ? parseFloat(((grossProfit / p.revenue) * 100).toFixed(2)) : 0;
      return {
        productId: p.productId,
        productName: p.productName,
        barcode: p.barcode,
        sku: p.sku,
        categoryName: p.categoryName,
        currentStock: parseFloat(p.currentStock.toFixed(2)),
        buyingPrice: p.buyingPrice,
        sellingPrice: p.sellingPrice,
        unitsSold: parseFloat(p.unitsSold.toFixed(2)),
        revenue: Math.round(p.revenue * 100) / 100,
        cogs: Math.round(p.cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        marginRate,
        transactionCount: p.saleIds.size,
      };
    });

    // Filtre par catégorie
    if (query.categoryId) {
      allItems = allItems.filter((i) => {
        const raw = aggregatedMap.get(i.productId);
        return raw?.categoryId === query.categoryId;
      });
    }

    // Filtre par recherche textuelle (nom, code-barres, SKU)
    if (query.search) {
      const searchLower = query.search.trim().toLowerCase();
      allItems = allItems.filter(
        (i) =>
          i.productName.toLowerCase().includes(searchLower) ||
          (i.barcode && i.barcode.toLowerCase().includes(searchLower)) ||
          (i.sku && i.sku.toLowerCase().includes(searchLower)),
      );
    }

    // Totaux globaux de la période (avant pagination)
    let totalUnitsSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const item of allItems) {
      totalUnitsSold += item.unitsSold;
      totalRevenue += item.revenue;
      totalCost += item.cogs;
    }

    const totalGrossProfit = totalRevenue - totalCost;
    const averageMarginRate = totalRevenue > 0 ? parseFloat(((totalGrossProfit / totalRevenue) * 100).toFixed(2)) : 0;

    // Tri des résultats
    const sortBy = query.sortBy ?? 'revenue';
    const sortOrder = query.sortOrder ?? 'desc';
    const factor = sortOrder === 'desc' ? -1 : 1;

    allItems.sort((a, b) => {
      switch (sortBy) {
        case 'quantity':
          return (a.unitsSold - b.unitsSold) * factor;
        case 'profit':
          return (a.grossProfit - b.grossProfit) * factor;
        case 'name':
          return a.productName.localeCompare(b.productName) * factor;
        case 'revenue':
        default:
          return (a.revenue - b.revenue) * factor;
      }
    });

    // Pagination
    const total = allItems.length;
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 50);
    const skip = (page - 1) * limit;
    const paginatedItems = allItems.slice(skip, skip + limit);

    return {
      shop,
      period: { from, to },
      summary: {
        totalProductsSold: total,
        totalUnitsSold: parseFloat(totalUnitsSold.toFixed(2)),
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        averageMarginRate,
      },
      items: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
