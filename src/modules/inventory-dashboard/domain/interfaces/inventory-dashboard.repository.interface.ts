export interface RawStockSnapshot {
  totalActiveProducts: number;
  totalStockUnits: number;
  inventoryValue: number;
  potentialRevenue: number;
  outOfStockCount: number;
  lowStockCount: number;
}

export interface RawProductPerf {
  productId: string;
  productName: string;
  sku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  stockQty: number;
  buyingPrice: number;
  sellingPrice: number;
  unitsSold: number;
  revenue: number;
  cogs: number;
  transactionCount: number;
}

export interface RawCategoryStock {
  categoryId: string | null;
  categoryName: string | null;
  colorHex: string | null;
  productCount: number;
  totalStockUnits: number;
  inventoryValue: number;
  potentialRevenue: number;
}

export interface RawSalesSummary {
  revenue: number;
  cogs: number;
  transactionCount: number;
  unitsSold: number;
}

export interface RawDormantProduct {
  productId: string;
  productName: string;
  stockQty: number;
  stockValue: number;
  lastSaleDate: Date | null;
}

export interface RawStockAlert {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  stockQty: number;
  minStockQty: number;
  buyingPrice: number;
}

export interface IInventoryDashboardRepository {
  getStockSnapshot(shopId: string): Promise<RawStockSnapshot>;
  getProductPerformance(shopId: string, from: Date, to: Date, limit: number): Promise<RawProductPerf[]>;
  getSalesSummary(shopId: string, from: Date, to: Date): Promise<RawSalesSummary>;
  getCategoryStockValuation(shopId: string): Promise<RawCategoryStock[]>;
  getDormantProducts(shopId: string, since: Date, limit?: number): Promise<RawDormantProduct[]>;
  getStockAlerts(shopId: string): Promise<RawStockAlert[]>;
}
