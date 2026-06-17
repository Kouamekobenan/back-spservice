import { ApiProperty } from '@nestjs/swagger';

// ── Overview ─────────────────────────────────────────────────────

export class StockKpiDto {
  @ApiProperty({ description: 'Nombre de produits actifs', example: 142 })
  totalActiveProducts!: number;

  @ApiProperty({ description: 'Total unités en stock', example: 3820.5 })
  totalStockUnits!: number;

  @ApiProperty({ description: 'Valeur stock au prix d\'achat (XOF)', example: 4500000 })
  inventoryValue!: number;

  @ApiProperty({ description: 'CA potentiel si tout est vendu (XOF)', example: 6800000 })
  potentialRevenue!: number;

  @ApiProperty({ description: 'Bénéfice potentiel si tout est vendu (XOF)', example: 2300000 })
  potentialProfit!: number;

  @ApiProperty({ description: 'Taux de marge potentiel en %', example: 33.82 })
  potentialProfitRate!: number;
}

export class SalesKpiDto {
  @ApiProperty({ description: 'Chiffre d\'affaires sur la période (XOF)', example: 1850000 })
  revenue!: number;

  @ApiProperty({ description: 'Coût des marchandises vendues (XOF)', example: 1250000 })
  cogs!: number;

  @ApiProperty({ description: 'Bénéfice brut réalisé (XOF)', example: 600000 })
  grossProfit!: number;

  @ApiProperty({ description: 'Taux de marge brute en %', example: 32.43 })
  grossProfitRate!: number;

  @ApiProperty({ description: 'Nombre de transactions', example: 218 })
  transactionCount!: number;

  @ApiProperty({ description: 'Unités vendues sur la période', example: 1240.5 })
  unitsSold!: number;
}

export class AlertSummaryDto {
  @ApiProperty({ description: 'Produits en rupture totale (stock = 0)', example: 5 })
  outOfStock!: number;

  @ApiProperty({ description: 'Produits sous le seuil d\'alerte', example: 12 })
  lowStock!: number;
}

export class InventoryOverviewResponseDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'month' })
  period!: string;

  @ApiProperty({ description: 'Plage de dates analysée' })
  dateRange!: { from: Date; to: Date };

  @ApiProperty({ type: StockKpiDto })
  stock!: StockKpiDto;

  @ApiProperty({ type: SalesKpiDto })
  sales!: SalesKpiDto;

  @ApiProperty({ type: AlertSummaryDto })
  alerts!: AlertSummaryDto;
}

// ── Top Produits ─────────────────────────────────────────────────

export class TopProductItemDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'uuid-product-1' })
  productId!: string;

  @ApiProperty({ example: 'Riz Parfumé 25kg' })
  productName!: string;

  @ApiProperty({ example: 'RIZ-25KG', nullable: true })
  sku!: string | null;

  @ApiProperty({ example: 'Alimentation', nullable: true })
  categoryName!: string | null;

  @ApiProperty({ example: '#22C55E', nullable: true })
  categoryColor!: string | null;

  @ApiProperty({ description: 'Quantité en stock restante', example: 48 })
  stockQty!: number;

  @ApiProperty({ description: 'Prix d\'achat unitaire (XOF)', example: 18000 })
  buyingPrice!: number;

  @ApiProperty({ description: 'Prix de vente unitaire (XOF)', example: 22000 })
  sellingPrice!: number;

  @ApiProperty({ description: 'Unités vendues sur la période', example: 39.5 })
  unitsSold!: number;

  @ApiProperty({ description: 'CA réalisé (XOF)', example: 869000 })
  revenue!: number;

  @ApiProperty({ description: 'Coût des ventes (XOF)', example: 711000 })
  cogs!: number;

  @ApiProperty({ description: 'Bénéfice brut (XOF)', example: 158000 })
  grossProfit!: number;

  @ApiProperty({ description: 'Taux de marge brute en %', example: 18.18 })
  grossProfitRate!: number;

  @ApiProperty({ description: 'Nombre de transactions incluant ce produit', example: 32 })
  transactionCount!: number;

  @ApiProperty({
    description: 'Jours de stock restants au rythme actuel (null si produit pas vendu)',
    example: 36,
    nullable: true,
  })
  stockCoverDays!: number | null;
}

export class DormantProductDto {
  @ApiProperty({ example: 'uuid-product-2' })
  productId!: string;

  @ApiProperty({ example: 'Huile de palme 5L' })
  productName!: string;

  @ApiProperty({ description: 'Stock immobilisé (unités)', example: 24 })
  stockQty!: number;

  @ApiProperty({ description: 'Valeur stock immobilisé (XOF)', example: 120000 })
  stockValue!: number;

  @ApiProperty({
    description: 'Jours depuis la dernière vente (null si jamais vendu)',
    example: 45,
    nullable: true,
  })
  daysSinceLastSale!: number | null;
}

export class TopProductsResponseDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'month' })
  period!: string;

  @ApiProperty()
  dateRange!: { from: Date; to: Date };

  @ApiProperty({ description: 'Nombre de jours dans la période', example: 30 })
  periodDays!: number;

  @ApiProperty({ type: [TopProductItemDto], description: 'Produits triés par unités vendues' })
  topSellers!: TopProductItemDto[];

  @ApiProperty({ type: [DormantProductDto], description: 'Produits avec stock mais sans vente sur la période' })
  dormantProducts!: DormantProductDto[];
}

// ── Valorisation par catégorie ───────────────────────────────────

export class CategoryStockDto {
  @ApiProperty({ example: 'uuid-cat-1', nullable: true })
  categoryId!: string | null;

  @ApiProperty({ example: 'Alimentation' })
  categoryName!: string;

  @ApiProperty({ example: '#22C55E' })
  colorHex!: string;

  @ApiProperty({ example: 28 })
  productCount!: number;

  @ApiProperty({ example: 1840.5 })
  totalStockUnits!: number;

  @ApiProperty({ description: 'Valeur au prix d\'achat (XOF)', example: 2100000 })
  inventoryValue!: number;

  @ApiProperty({ description: 'CA potentiel (XOF)', example: 3200000 })
  potentialRevenue!: number;

  @ApiProperty({ description: 'Bénéfice potentiel (XOF)', example: 1100000 })
  potentialProfit!: number;

  @ApiProperty({ description: 'Part de la valeur totale en %', example: 46.67 })
  shareOfTotalValue!: number;
}

export class StockValuationResponseDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty({ example: 'XOF' })
  currency!: string;

  @ApiProperty({ example: 4500000 })
  totalInventoryValue!: number;

  @ApiProperty({ example: 6800000 })
  totalPotentialRevenue!: number;

  @ApiProperty({ example: 2300000 })
  totalPotentialProfit!: number;

  @ApiProperty({ type: [CategoryStockDto] })
  byCategory!: CategoryStockDto[];
}

// ── Alertes inventaire ───────────────────────────────────────────

export class AlertProductDto {
  @ApiProperty({ example: 'uuid-product-1' })
  productId!: string;

  @ApiProperty({ example: 'Riz Parfumé 25kg' })
  productName!: string;

  @ApiProperty({ example: 'RIZ-25KG', nullable: true })
  sku!: string | null;

  @ApiProperty({ example: 'Alimentation', nullable: true })
  categoryName!: string | null;

  @ApiProperty({ example: 0 })
  stockQty!: number;

  @ApiProperty({ example: 5 })
  minStockQty!: number;

  @ApiProperty({ example: 18000 })
  buyingPrice!: number;

  @ApiProperty({ example: 0 })
  stockValue!: number;
}

export class AlertsSummaryDto {
  @ApiProperty({ example: 5 })
  outOfStockCount!: number;

  @ApiProperty({ example: 12 })
  lowStockCount!: number;

  @ApiProperty({ example: 8 })
  dormantCount!: number;

  @ApiProperty({ example: 25 })
  totalAlerts!: number;
}

export class InventoryAlertsResponseDto {
  @ApiProperty({ example: 'uuid-shop-1' })
  shopId!: string;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty({ type: AlertsSummaryDto })
  summary!: AlertsSummaryDto;

  @ApiProperty({ type: [AlertProductDto], description: 'Produits en rupture totale (stockQty = 0)' })
  outOfStock!: AlertProductDto[];

  @ApiProperty({ type: [AlertProductDto], description: 'Produits sous le seuil minimum (0 < stockQty ≤ minStockQty)' })
  lowStock!: AlertProductDto[];

  @ApiProperty({ type: [DormantProductDto], description: 'Produits avec stock non vendu sur la période' })
  dormantProducts!: DormantProductDto[];
}
