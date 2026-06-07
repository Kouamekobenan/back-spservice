

// ── Types de résultats intermédiaires ─────────────────────────────

import { Period, ShopFilter } from "../entities/dashbord-superAdmin";

export interface RawSalesAgg {
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  transactionCount: number;
}

export interface RawSoldItem {
  productId: string;
  quantity: number;
  totalPrice: number;
  buyingPrice: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  productName: string;
}

export interface RawCashierSales {
  userId: string;
  shopId: string;
  totalAmount: number;
  discountAmount: number;
  transactionCount: number;
  voidedCount: number;
}

export interface RawCashierSession {
  userId: string;
  totalMinutes: number;
  sessionCount: number;
  totalDifference: number;
}

export interface RawSalePoint {
  createdAt: Date;
  totalAmount: number;
  shopId: string;
  shopName: string;
}

export interface RawAlert {
  type: string;
  count: number;
  details: unknown[];
}

// ── Types batch (utilisés par les use cases multi-boutiques) ──────

/** Métriques de ventes agrégées par boutique — retournées en une seule query */
export interface RawShopSalesBatch {
  shopId: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  transactionCount: number;
  cogs: number; // coût des marchandises vendues
}

// ── Interfaces des Repositories ───────────────────────────────────

/**
 * Port pour l'accès aux données de ventes agrégées.
 */
export interface ISalesRepository {
  /**
   * Agrégats de ventes (CA, nb transactions, remises, taxes)
   * pour une période et un filtre de boutiques.
   */
  getAggregatedSales(
    period: Period,
    filter: ShopFilter,
  ): Promise<{
    current: RawSalesAgg;
    previous: RawSalesAgg;
  }>;

  /**
   * Batch : métriques de ventes groupées par boutique (current + previous)
   * en 3 queries au lieu de N×2. Utilisé par GetShopsPerformanceUseCase.
   */
  getShopsMetricsBatch(
    period: Period,
    shopIds?: string[],
  ): Promise<{
    current: RawShopSalesBatch[];
    previous: RawShopSalesBatch[];
  }>;

  /**
   * Récupère tous les articles vendus avec leur coût d'achat
   * pour le calcul du COGS et des marges.
   */
  getSoldItemsWithCost(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawSoldItem[]>;

  /**
   * Série temporelle des ventes pour les graphiques.
   */
  getSalesTimeline(period: Period, filter: ShopFilter): Promise<RawSalePoint[]>;

  /**
   * Nombre de ventes annulées aujourd'hui.
   */
  getTodayVoidRate(): Promise<{ total: number; voided: number }>;
}

/**
 * Port pour l'accès aux données de boutiques.
 */
export interface IShopRepository {
  /**
   * Toutes les boutiques actives avec leurs métadonnées de base.
   */
  findAllActive(): Promise<
    Array<{
      id: string;
      name: string;
      address: string | null;
      currency: string;
    }>
  >;

  /**
   * Nombre de boutiques actives.
   */
  countActive(): Promise<number>;
}

/**
 * Port pour l'accès aux données de caissiers.
 */
export interface ICashierRepository {
  /**
   * Ventes agrégées par caissier (CA, nb transactions, annulations, remises).
   */
  getSalesByUser(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawCashierSales[]>;

  /**
   * Données des sessions de caisse (durée active, écarts) par caissier.
   */
  getSessionsByUser(
    period: Period,
    filter: ShopFilter,
  ): Promise<RawCashierSession[]>;

  /**
   * Infos complètes d'un ensemble d'utilisateurs.
   */
  getUsersByIds(userIds: string[]): Promise<
    Array<{
      id: string;
      name: string;
      username: string;
      role: string;
      shopAccesses: Array<{ shopId: string; shopName: string }>;
    }>
  >;
}

/**
 * Port pour l'accès aux dépenses.
 */
export interface IExpenseRepository {
  /**
   * Dépenses totales et par catégorie sur une période.
   */
  getAggregatedExpenses(
    period: Period,
    filter: ShopFilter,
  ): Promise<{
    total: number;
    previous: number;
    byCategory: Array<{ category: string; amount: number }>;
  }>;

  /**
   * Batch : dépenses groupées par boutique (1 query).
   * Retourne un Map shopId → montant total des dépenses.
   */
  getExpensesByShopBatch(
    period: Period,
    shopIds?: string[],
  ): Promise<Record<string, number>>;
}

/**
 * Port pour l'accès aux données clients (crédit).
 */
export interface ICustomerRepository {
  /** Encours de crédit global et clients à risque. */
  getCreditOutstanding(): Promise<{
    totalDebt: number;
    customersCount: number;
  }>;

  /** Nouveaux clients sur une période. */
  countNewCustomers(period: Period): Promise<number>;

  /** Clients dépassant un seuil de dette. */
  getHighDebtCustomers(threshold: number): Promise<
    Array<{
      id: string;
      name: string;
      phone: string | null;
      totalDebt: number;
      creditLimit: number | null;
    }>
  >;
}

/**
 * Port pour la génération d'alertes opérationnelles.
 */
export interface IAlertRepository {
  /** Produits dont le stock est inférieur ou égal au seuil d'alerte. */
  getLowStockProducts(limit?: number): Promise<
    Array<{
      id: string;
      name: string;
      stockQty: number;
      minStockQty: number;
      shopId: string;
      shopName: string;
    }>
  >;

  /** Sessions de caisse non fermées depuis J-1 et avant. */
  getUnclosedSessions(): Promise<
    Array<{
      id: string;
      shopName: string;
      cashierName: string;
      openedAt: Date;
    }>
  >;

  /** Sessions avec écart de caisse supérieur au seuil. */
  getAbnormalCashSessions(
    thresholdAmount: number,
    lookbackDays?: number,
  ): Promise<
    Array<{
      id: string;
      shopName: string;
      cashierName: string;
      difference: number;
      closedAt: Date;
    }>
  >;

  /** Éléments en attente de synchronisation offline. */
  getPendingSyncCount(): Promise<{ pending: number; errors: number }>;
}
