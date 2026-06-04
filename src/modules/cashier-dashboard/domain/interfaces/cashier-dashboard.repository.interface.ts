export interface RawDaySales {
  totalRevenue: number;
  totalPaid: number;
  totalDiscounts: number;
  totalChange: number;
  transactionCount: number;
  voidedCount: number;
}

export interface RawPaymentBreakdown {
  method: string;
  amount: number;
  count: number;
}

export interface RawTimelinePoint {
  hour: number;
  revenue: number;
  transactionCount: number;
}

export interface RawRecentSale {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
  primaryPaymentMethod: string;
}

export interface RawSession {
  id: string;
  openedAt: Date;
  openingBalance: number;
  expectedBalance: number | null;
  closingBalance: number | null;
  difference: number | null;
  closedAt: Date | null;
}

export interface ICashierDashboardRepository {
  getDaySales(userId: string, shopId: string, from: Date, to: Date): Promise<RawDaySales>;
  getPaymentBreakdown(userId: string, shopId: string, from: Date, to: Date): Promise<RawPaymentBreakdown[]>;
  getSalesTimeline(userId: string, shopId: string, from: Date, to: Date): Promise<RawTimelinePoint[]>;
  getRecentSales(userId: string, shopId: string, from: Date, to: Date, limit: number): Promise<RawRecentSale[]>;
  getActiveSession(userId: string, shopId: string): Promise<RawSession | null>;
  getCashierInfo(userId: string): Promise<{ name: string; username: string; role: string } | null>;
}
