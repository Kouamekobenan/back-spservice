import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type {
  SalesReportData,
  FinancialReportData,
  StockReportData,
  DebtsReportData,
} from '../repository/export.repository.js';

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Espèces', MOBILE_MONEY: 'Mobile Money', BANK_CARD: 'Carte bancaire',
  CREDIT: 'Crédit', MIXED: 'Mixte',
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complétée', PARTIALLY_PAID: 'Paiement partiel', VOIDED: 'Annulée', REFUNDED: 'Remboursée',
};
const EXPENSE_LABELS: Record<string, string> = {
  RENT: 'Loyer', UTILITIES: 'Eau/Électricité', SALARY: 'Salaires',
  SUPPLIES: 'Fournitures', TRANSPORT: 'Transport', MAINTENANCE: 'Maintenance',
  TAXES: 'Taxes', MARKETING: 'Marketing', OTHER: 'Autres',
};

// Styles réutilisables
const HEADER_FILL: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFF8FAFC' }, size: 10 };
const ACCENT_FILL: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
const GREEN_FILL: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
const RED_FILL: ExcelJS.Fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
const ORANGE_FILL: ExcelJS.Fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };
const TOTAL_FILL: ExcelJS.Fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
const TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFF8FAFC' }, size: 10 };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

function setHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, values: string[], widths?: number[]) {
  const row = sheet.getRow(rowNum);
  row.values = ['', ...values];
  row.eachCell((cell, col) => {
    if (col === 1) return;
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: col > 3 ? 'right' : 'left' };
  });
  row.height = 22;
  if (widths) widths.forEach((w, i) => { sheet.getColumn(i + 2).width = w; });
}

function addTitleBlock(sheet: ExcelJS.Worksheet, title: string, subtitle: string, shop: string): number {
  sheet.getRow(1).values = ['', title];
  sheet.getRow(1).getCell(2).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
  sheet.getRow(2).values = ['', subtitle];
  sheet.getRow(2).getCell(2).font = { size: 10, color: { argb: 'FF64748B' } };
  sheet.getRow(3).values = ['', `Boutique : ${shop}   |   Généré le : ${new Intl.DateTimeFormat('fr-FR').format(new Date())}`];
  sheet.getRow(3).getCell(2).font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };
  sheet.getRow(4).values = [];
  return 5;
}

// ── Rapport Ventes ────────────────────────────────────────────────────────────

async function buildSalesSheet(wb: ExcelJS.Workbook, data: SalesReportData) {
  const sheet = wb.addWorksheet('Ventes', { properties: { tabColor: { argb: 'FF3B82F6' } } });
  const cur = data.shop.currency;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat('fr-FR').format(d);

  let row = addTitleBlock(sheet, 'RAPPORT DES VENTES',
    `Période : ${fmtDate(data.from)} → ${fmtDate(data.to)}`, data.shop.name);

  // KPIs
  const kpis = [
    ['Chiffre d\'affaires', data.summary.totalRevenue, ACCENT_FILL],
    ['Transactions', data.summary.transactionCount, null],
    ['Panier moyen', data.summary.averageBasket, null],
    ['Remises', data.summary.totalDiscounts, null],
    ['Montant encaissé', data.summary.totalPaid, GREEN_FILL],
    ['Annulées', data.summary.voidedCount, null],
  ] as const;

  sheet.getRow(row).values = ['', '— SYNTHÈSE —'];
  sheet.getRow(row).getCell(2).font = { bold: true, size: 11 };
  row++;

  for (const [label, value, fill] of kpis) {
    const r = sheet.getRow(row++);
    r.values = ['', label, typeof value === 'number' && value > 100 ? value : value];
    r.getCell(2).font = { color: { argb: 'FF475569' } };
    r.getCell(3).font = { bold: true };
    r.getCell(3).numFmt = typeof value === 'number' && label.includes('tions') || label.includes('ées')
      ? '0' : `#,##0 "${cur}"`;
    if (fill) { r.getCell(2).fill = fill; r.getCell(3).fill = fill; }
  }
  row++;

  // Paiements
  sheet.getRow(row).values = ['', '— RÉPARTITION PAR PAIEMENT —'];
  sheet.getRow(row).getCell(2).font = { bold: true, size: 11 };
  row++;
  setHeaderRow(sheet, row++, ['Mode de paiement', 'Transactions', `Montant (${cur})`], [30, 20, 20, 20]);
  for (const p of data.summary.paymentBreakdown) {
    const r = sheet.getRow(row++);
    r.values = ['', PAYMENT_LABELS[p.method] ?? p.method, p.count, p.amount];
    r.getCell(4).numFmt = `#,##0 "${cur}"`;
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }
  row++;

  // Détail ventes
  sheet.getRow(row).values = ['', '— DÉTAIL DES VENTES —'];
  sheet.getRow(row).getCell(2).font = { bold: true, size: 11 };
  row++;
  setHeaderRow(sheet, row++,
    ['Date', 'Reçu', 'Statut', 'Caissier', 'Client', 'Articles', 'Paiement', `Total (${cur})`, `Remise (${cur})`],
    [4, 18, 22, 14, 18, 14, 10, 18, 18, 18]);

  for (const s of data.sales) {
    const r = sheet.getRow(row++);
    r.values = ['',
      new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(s.createdAt),
      s.receiptNumber,
      STATUS_LABELS[s.status] ?? s.status,
      s.cashierName,
      s.customerName ?? '—',
      s.itemCount,
      s.paymentMethods.split(', ').map((m) => PAYMENT_LABELS[m] ?? m).join(', '),
      s.totalAmount,
      s.discountAmount,
    ];
    r.getCell(9).numFmt = `#,##0 "${cur}"`;
    r.getCell(10).numFmt = `#,##0 "${cur}"`;
    r.eachCell((c, col) => { if (col > 1) { c.border = THIN_BORDER; c.alignment = { vertical: 'middle' }; } });
  }

  // Total
  const total = sheet.getRow(row);
  total.values = ['', '', '', '', '', '', '', 'TOTAL', data.summary.totalRevenue, data.summary.totalDiscounts];
  [8, 9, 10].forEach((col) => {
    total.getCell(col).fill = TOTAL_FILL;
    total.getCell(col).font = TOTAL_FONT;
    total.getCell(col).numFmt = `#,##0 "${cur}"`;
  });
  total.height = 20;
}

// ── Rapport Financier ─────────────────────────────────────────────────────────

async function buildFinancialSheet(wb: ExcelJS.Workbook, data: FinancialReportData) {
  const sheet = wb.addWorksheet('Financier', { properties: { tabColor: { argb: 'FF22C55E' } } });
  const cur = data.shop.currency;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat('fr-FR').format(d);

  let row = addTitleBlock(sheet, 'RAPPORT FINANCIER',
    `Période : ${fmtDate(data.from)} → ${fmtDate(data.to)}`, data.shop.name);

  sheet.getColumn(2).width = 35;
  sheet.getColumn(3).width = 22;

  const pnlLines: Array<[string, number, string?, ExcelJS.Fill?]> = [
    ['CA brut (avant remises)',      data.revenue.gross,    `#,##0 "${cur}"`, ACCENT_FILL],
    ['Remises accordées',            -data.revenue.discounts, `#,##0 "${cur}";[Red]-#,##0 "${cur}"`, undefined],
    ['CA net',                       data.revenue.net,      `#,##0 "${cur}"`, ACCENT_FILL],
    ['Coût des marchandises (COGS)', -data.cogs,            `#,##0 "${cur}";[Red]-#,##0 "${cur}"`, undefined],
    [`Marge brute (${data.grossMarginRate.toFixed(1)}%)`, data.grossMargin, `#,##0 "${cur}"`, data.grossMargin >= 0 ? GREEN_FILL : RED_FILL],
    ['Total charges',                -data.expenses.total,  `#,##0 "${cur}";[Red]-#,##0 "${cur}"`, undefined],
    ['RÉSULTAT NET',                 data.netResult,        `#,##0 "${cur}"`, data.isProfit ? GREEN_FILL : RED_FILL],
  ];

  sheet.getRow(row).values = ['', '— COMPTE DE RÉSULTAT —'];
  sheet.getRow(row).getCell(2).font = { bold: true, size: 11 };
  row++;

  for (const [label, value, numFmt, fill] of pnlLines) {
    const r = sheet.getRow(row++);
    r.values = ['', label, value];
    r.getCell(3).numFmt = numFmt ?? `#,##0 "${cur}"`;
    r.getCell(3).font = { bold: label === 'RÉSULTAT NET', size: label === 'RÉSULTAT NET' ? 13 : 10 };
    if (fill) { r.getCell(2).fill = fill; r.getCell(3).fill = fill; }
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }
  row++;

  sheet.getRow(row).values = ['', '— CHARGES PAR CATÉGORIE —'];
  sheet.getRow(row).getCell(2).font = { bold: true, size: 11 };
  row++;
  setHeaderRow(sheet, row++, ['Catégorie', `Montant (${cur})`, 'Part (%)']);

  for (const e of data.expenses.byCategory) {
    const r = sheet.getRow(row++);
    const share = data.expenses.total > 0 ? ((e.amount / data.expenses.total) * 100).toFixed(1) : '0';
    r.values = ['', EXPENSE_LABELS[e.category] ?? e.category, e.amount, parseFloat(share)];
    r.getCell(3).numFmt = `#,##0 "${cur}"`;
    r.getCell(4).numFmt = '0.0"%"';
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }

  const tot = sheet.getRow(row);
  tot.values = ['', 'TOTAL', data.expenses.total, 100];
  [2, 3, 4].forEach((col) => { tot.getCell(col).fill = TOTAL_FILL; tot.getCell(col).font = TOTAL_FONT; });
  tot.getCell(3).numFmt = `#,##0 "${cur}"`;
  tot.getCell(4).numFmt = '0"%"';
}

// ── Rapport Stock ─────────────────────────────────────────────────────────────

async function buildStockSheet(wb: ExcelJS.Workbook, data: StockReportData) {
  const sheet = wb.addWorksheet('Stock', { properties: { tabColor: { argb: 'FFF97316' } } });
  const cur = data.shop.currency;

  let row = addTitleBlock(sheet, 'RAPPORT DE STOCK',
    `Généré le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(data.generatedAt)}`,
    data.shop.name);

  // KPIs
  const kpiData = [
    ['Valeur totale du stock', data.summary.totalStockValue, `#,##0 "${cur}"`, ACCENT_FILL],
    ['Produits actifs',        data.summary.totalProducts,  '0',               null],
    ['Stock bas',              data.summary.lowStockCount,  '0',               ORANGE_FILL],
    ['En rupture',             data.summary.outOfStockCount,'0',               RED_FILL],
  ] as const;

  for (const [label, value, fmt, fill] of kpiData) {
    const r = sheet.getRow(row++);
    r.values = ['', label, value];
    r.getCell(3).numFmt = fmt;
    r.getCell(3).font = { bold: true };
    if (fill) { r.getCell(2).fill = fill; r.getCell(3).fill = fill; }
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }
  row++;

  setHeaderRow(sheet, row++,
    ['Produit', 'SKU', 'Catégorie', 'Unité', 'Qté stock', 'Qté min', `Prix achat (${cur})`, `Prix vente (${cur})`, `Valeur stock (${cur})`, 'Statut'],
    [4, 28, 12, 14, 10, 10, 10, 16, 16, 16, 10]);

  for (const p of data.products) {
    const r = sheet.getRow(row++);
    r.values = ['', p.name, p.sku ?? '', p.categoryName ?? '', p.unitName ?? '',
      p.stockQty, p.minStockQty, p.buyingPrice, p.sellingPrice, p.stockValue,
      p.status === 'OK' ? 'OK' : p.status === 'LOW' ? 'Stock bas' : 'Rupture'];

    r.getCell(7).numFmt = '0.000'; // stockQty
    r.getCell(8).numFmt = '0.000'; // minStockQty
    r.getCell(9).numFmt = `#,##0 "${cur}"`;
    r.getCell(10).numFmt = `#,##0 "${cur}"`;
    r.getCell(11).numFmt = `#,##0 "${cur}"`;

    if (p.status === 'OUT') r.eachCell((c, col) => { if (col > 1) c.fill = RED_FILL; });
    else if (p.status === 'LOW') r.eachCell((c, col) => { if (col > 1) c.fill = ORANGE_FILL; });
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }

  const tot = sheet.getRow(row);
  tot.values = ['', '', '', '', '', '', '', '', '', data.summary.totalStockValue, ''];
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((col) => {
    tot.getCell(col).fill = TOTAL_FILL;
    tot.getCell(col).font = TOTAL_FONT;
  });
  tot.getCell(10).numFmt = `#,##0 "${cur}"`;
}

// ── Rapport Dettes ────────────────────────────────────────────────────────────

async function buildDebtsSheet(wb: ExcelJS.Workbook, data: DebtsReportData) {
  const sheet = wb.addWorksheet('Créances', { properties: { tabColor: { argb: 'FFEF4444' } } });
  const cur = data.shop.currency;

  let row = addTitleBlock(sheet, 'RAPPORT DES CRÉANCES CLIENTS',
    `Généré le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(data.generatedAt)}`,
    data.shop.name);

  const kpiData = [
    ['Total des dettes',   data.summary.totalDebt,      RED_FILL],
    ['Clients débiteurs',  data.summary.totalCustomers, null],
    ['Plafond dépassé',    data.summary.overLimitCount, ORANGE_FILL],
  ] as const;

  for (const [label, value, fill] of kpiData) {
    const r = sheet.getRow(row++);
    r.values = ['', label, value];
    r.getCell(3).numFmt = typeof value === 'number' && value > 100 ? `#,##0 "${cur}"` : '0';
    r.getCell(3).font = { bold: true };
    if (fill) { r.getCell(2).fill = fill; r.getCell(3).fill = fill; }
    r.eachCell((c, col) => { if (col > 1) c.border = THIN_BORDER; });
  }
  row++;

  setHeaderRow(sheet, row++,
    ['Nom', 'Téléphone', `Dette (${cur})`, `Plafond (${cur})`, 'Statut'],
    [4, 30, 16, 22, 22, 14]);

  for (const c of data.customers) {
    const r = sheet.getRow(row++);
    r.values = ['', c.name, c.phone ?? '—', c.totalDebt, c.creditLimit ?? '—',
      c.isOverLimit ? 'Dépassé' : 'OK'];
    r.getCell(4).numFmt = `#,##0 "${cur}"`;
    if (typeof c.creditLimit === 'number') r.getCell(5).numFmt = `#,##0 "${cur}"`;
    if (c.isOverLimit) r.eachCell((cell, col) => { if (col > 1) cell.fill = RED_FILL; });
    r.eachCell((cell, col) => { if (col > 1) cell.border = THIN_BORDER; });
  }

  const tot = sheet.getRow(row);
  tot.values = ['', 'TOTAL', '', data.summary.totalDebt, '', ''];
  [2, 3, 4, 5, 6].forEach((col) => { tot.getCell(col).fill = TOTAL_FILL; tot.getCell(col).font = TOTAL_FONT; });
  tot.getCell(4).numFmt = `#,##0 "${cur}"`;
}

// ── Service principal ─────────────────────────────────────────────────────────

@Injectable()
export class ExcelGenerator {
  private async toBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async generateSales(data: SalesReportData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SP Service';
    wb.created = new Date();
    await buildSalesSheet(wb, data);
    return this.toBuffer(wb);
  }

  async generateFinancial(data: FinancialReportData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SP Service';
    await buildFinancialSheet(wb, data);
    return this.toBuffer(wb);
  }

  async generateStock(data: StockReportData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SP Service';
    await buildStockSheet(wb, data);
    return this.toBuffer(wb);
  }

  async generateDebts(data: DebtsReportData): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SP Service';
    await buildDebtsSheet(wb, data);
    return this.toBuffer(wb);
  }
}
