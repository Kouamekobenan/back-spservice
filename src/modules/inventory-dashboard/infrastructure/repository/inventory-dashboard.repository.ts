import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  IInventoryDashboardRepository,
  RawCategoryStock,
  RawDormantProduct,
  RawProductPerf,
  RawSalesSummary,
  RawStockAlert,
  RawStockSnapshot,
} from '../../domain/interfaces/inventory-dashboard.repository.interface.js';

const COMPLETED_STATUSES = ['COMPLETED', 'PARTIALLY_PAID'] as const;

@Injectable()
export class InventoryDashboardRepository implements IInventoryDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Snapshot valeur stock ────────────────────────────────────────

  async getStockSnapshot(shopId: string): Promise<RawStockSnapshot> {
    const products = await this.prisma.product.findMany({
      where: { shopId, isActive: true },
      select: {
        stockQty: true,
        minStockQty: true,
        buyingPrice: true,
        sellingPrice: true,
      },
    });

    let totalStockUnits = 0;
    let inventoryValue = 0;
    let potentialRevenue = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    for (const p of products) {
      const qty = Number(p.stockQty);
      const min = Number(p.minStockQty);
      totalStockUnits += qty;
      inventoryValue += qty * Number(p.buyingPrice);
      potentialRevenue += qty * Number(p.sellingPrice);
      if (qty === 0) outOfStockCount++;
      else if (qty <= min) lowStockCount++;
    }

    return {
      totalActiveProducts: products.length,
      totalStockUnits,
      inventoryValue,
      potentialRevenue,
      outOfStockCount,
      lowStockCount,
    };
  }

  // ── Résumé ventes sur la période ────────────────────────────────

  async getSalesSummary(shopId: string, from: Date, to: Date): Promise<RawSalesSummary> {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          shopId,
          status: { in: [...COMPLETED_STATUSES] },
          createdAt: { gte: from, lte: to },
        },
      },
      select: {
        quantity: true,
        totalPrice: true,
        saleId: true,
        product: { select: { buyingPrice: true } },
      },
    });

    const saleIds = new Set<string>();
    let revenue = 0;
    let cogs = 0;
    let unitsSold = 0;

    for (const item of items) {
      saleIds.add(item.saleId);
      const qty = Number(item.quantity);
      revenue += Number(item.totalPrice);
      cogs += qty * Number(item.product.buyingPrice);
      unitsSold += qty;
    }

    return { revenue, cogs, transactionCount: saleIds.size, unitsSold };
  }

  // ── Performance produits (top vendeurs) ─────────────────────────

  async getProductPerformance(
    shopId: string,
    from: Date,
    to: Date,
    limit: number,
  ): Promise<RawProductPerf[]> {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          shopId,
          status: { in: [...COMPLETED_STATUSES] },
          createdAt: { gte: from, lte: to },
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        totalPrice: true,
        saleId: true,
        product: {
          select: {
            sku: true,
            buyingPrice: true,
            sellingPrice: true,
            stockQty: true,
            categoryId: true,
            category: { select: { name: true, colorHex: true } },
          },
        },
      },
    });

    const map = new Map<
      string,
      RawProductPerf & { saleIds: Set<string> }
    >();

    for (const item of items) {
      if (!map.has(item.productId)) {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.product.sku,
          categoryId: item.product.categoryId,
          categoryName: item.product.category?.name ?? null,
          categoryColor: item.product.category?.colorHex ?? null,
          stockQty: Number(item.product.stockQty),
          buyingPrice: Number(item.product.buyingPrice),
          sellingPrice: Number(item.product.sellingPrice),
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          transactionCount: 0,
          saleIds: new Set(),
        });
      }

      const entry = map.get(item.productId)!;
      const qty = Number(item.quantity);
      entry.unitsSold += qty;
      entry.revenue += Number(item.totalPrice);
      entry.cogs += qty * Number(item.product.buyingPrice);
      entry.saleIds.add(item.saleId);
    }

    return [...map.values()]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit)
      .map(({ saleIds, ...rest }) => ({
        ...rest,
        transactionCount: saleIds.size,
      }));
  }

  // ── Produits dormants (stock > 0, zéro vente sur la période) ────

  async getDormantProducts(
    shopId: string,
    since: Date,
    limit = 20,
  ): Promise<RawDormantProduct[]> {
    // 1. Produits vendus sur la période → à exclure
    const soldItems = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          shopId,
          status: { in: [...COMPLETED_STATUSES] },
          createdAt: { gte: since },
        },
      },
      select: { productId: true },
      distinct: ['productId'],
    });
    const soldIds = new Set(soldItems.map((i) => i.productId));

    // 2. Produits avec stock > 0 absents des ventes
    const dormant = await this.prisma.product.findMany({
      where: {
        shopId,
        isActive: true,
        stockQty: { gt: 0 },
        id: { notIn: [...soldIds] },
      },
      select: { id: true, name: true, stockQty: true, buyingPrice: true },
      orderBy: [{ stockQty: 'desc' }],
      take: limit,
    });

    if (dormant.length === 0) return [];

    // 3. Dernière date de vente (toute période confondue) par produit
    const dormantIds = dormant.map((p) => p.id);
    const lastSaleRows = await this.prisma.saleItem.findMany({
      where: {
        productId: { in: dormantIds },
        sale: { status: { in: [...COMPLETED_STATUSES] } },
      },
      select: { productId: true, sale: { select: { createdAt: true } } },
      orderBy: { sale: { createdAt: 'desc' } },
      distinct: ['productId'],
    });

    const lastSaleMap = new Map(
      lastSaleRows.map((r) => [r.productId, r.sale.createdAt]),
    );

    return dormant.map((p) => ({
      productId: p.id,
      productName: p.name,
      stockQty: Number(p.stockQty),
      stockValue: Number(p.stockQty) * Number(p.buyingPrice),
      lastSaleDate: lastSaleMap.get(p.id) ?? null,
    }));
  }

  // ── Valorisation stock par catégorie ────────────────────────────

  async getCategoryStockValuation(shopId: string): Promise<RawCategoryStock[]> {
    const products = await this.prisma.product.findMany({
      where: { shopId, isActive: true },
      select: {
        stockQty: true,
        buyingPrice: true,
        sellingPrice: true,
        categoryId: true,
        category: { select: { name: true, colorHex: true } },
      },
    });

    const catMap = new Map<string, RawCategoryStock & { _count: number }>();

    for (const p of products) {
      const catKey = p.categoryId ?? '__none__';
      if (!catMap.has(catKey)) {
        catMap.set(catKey, {
          categoryId: p.categoryId,
          categoryName: p.category?.name ?? 'Non catégorisé',
          colorHex: p.category?.colorHex ?? '#94A3B8',
          productCount: 0,
          totalStockUnits: 0,
          inventoryValue: 0,
          potentialRevenue: 0,
          _count: 0,
        });
      }
      const cat = catMap.get(catKey)!;
      const qty = Number(p.stockQty);
      cat._count++;
      cat.productCount = cat._count;
      cat.totalStockUnits += qty;
      cat.inventoryValue += qty * Number(p.buyingPrice);
      cat.potentialRevenue += qty * Number(p.sellingPrice);
    }

    return [...catMap.values()]
      .sort((a, b) => b.inventoryValue - a.inventoryValue)
      .map(({ _count, ...rest }) => rest);
  }

  // ── Alertes stock (rupture + stock bas) ─────────────────────────

  async getStockAlerts(shopId: string): Promise<RawStockAlert[]> {
    const products = await this.prisma.product.findMany({
      where: { shopId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQty: true,
        minStockQty: true,
        buyingPrice: true,
        category: { select: { name: true } },
      },
      orderBy: { stockQty: 'asc' },
    });

    return products
      .filter((p) => Number(p.stockQty) <= Number(p.minStockQty))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        categoryName: p.category?.name ?? null,
        stockQty: Number(p.stockQty),
        minStockQty: Number(p.minStockQty),
        buyingPrice: Number(p.buyingPrice),
      }));
  }
}
