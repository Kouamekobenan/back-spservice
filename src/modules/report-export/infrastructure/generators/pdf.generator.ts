import { Injectable } from '@nestjs/common';
import { getBrowser } from '../../../../common/print/browser.pool.js';
import type {
  SalesReportData,
  FinancialReportData,
  StockReportData,
  DebtsReportData,
} from '../repository/export.repository.js';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);

const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(d);

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Espèces', MOBILE_MONEY: 'Mobile Money', BANK_CARD: 'Carte bancaire',
  CREDIT: 'Crédit', MIXED: 'Mixte',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complétée', PARTIALLY_PAID: 'Partiel', VOIDED: 'Annulée', REFUNDED: 'Remboursée',
};

const EXPENSE_LABELS: Record<string, string> = {
  RENT: 'Loyer', UTILITIES: 'Eau/Électricité', SALARY: 'Salaires',
  SUPPLIES: 'Fournitures', TRANSPORT: 'Transport', MAINTENANCE: 'Maintenance',
  TAXES: 'Taxes', MARKETING: 'Marketing', OTHER: 'Autres',
};

// ── Style CSS commun ──────────────────────────────────────────────────────────

const baseStyle = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  .page { padding: 28px 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .brand span { color: #3b82f6; }
  .header-meta { text-align: right; color: #64748b; font-size: 10px; line-height: 1.6; }
  .report-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  h2 { font-size: 12px; font-weight: 700; color: #0f172a; margin: 16px 0 8px;
       padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
  .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .kpi-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  .kpi-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
  .kpi.accent { border-color: #3b82f6; background: #eff6ff; }
  .kpi.accent .kpi-value { color: #1d4ed8; }
  .kpi.green { border-color: #22c55e; background: #f0fdf4; }
  .kpi.green .kpi-value { color: #15803d; }
  .kpi.red { border-color: #ef4444; background: #fef2f2; }
  .kpi.red .kpi-value { color: #dc2626; }
  .kpi.orange { border-color: #f97316; background: #fff7ed; }
  .kpi.orange .kpi-value { color: #c2410c; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #0f172a; color: #f8fafc; padding: 7px 8px; text-align: left;
       font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; }
  .badge-ok { background: #dcfce7; color: #15803d; }
  .badge-low { background: #fef9c3; color: #854d0e; }
  .badge-out { background: #fee2e2; color: #dc2626; }
  .badge-completed { background: #dbeafe; color: #1e40af; }
  .badge-voided { background: #fce7f3; color: #9d174d; }
  .badge-refunded { background: #ede9fe; color: #6d28d9; }
  .badge-partial { background: #ffedd5; color: #c2410c; }
  .text-right { text-align: right; }
  .text-bold { font-weight: 700; }
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px;
            display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }
  .summary-row td { font-weight: 700; background: #0f172a !important; color: #f8fafc; }
`;

// ── Entête commune ────────────────────────────────────────────────────────────

function header(shop: { name: string; address: string | null; phone: string | null }, title: string, subtitle: string) {
  return `
    <div class="header">
      <div>
        <div class="brand">SP <span>SERVICE</span></div>
        <div style="color:#64748b;font-size:10px;margin-top:4px;">
          ${shop.address ?? ''} ${shop.phone ? '· ' + shop.phone : ''}
        </div>
      </div>
      <div class="header-meta">
        <div class="report-title">${title}</div>
        <div>${subtitle}</div>
        <div>Généré le ${fmtDate(new Date())}</div>
        <div style="font-weight:600;">${shop.name}</div>
      </div>
    </div>`;
}

function footer() {
  return `<div class="footer"><div>SP Service — Document généré automatiquement</div><div>Confidentiel</div></div>`;
}

// ── Génération HTML par type de rapport ──────────────────────────────────────

function buildSalesHtml(data: SalesReportData): string {
  const { shop, from, to, summary, sales } = data;
  const cur = shop.currency;
  const periodLabel = `${fmtDay(from)} → ${fmtDay(to)}`;

  const paymentRows = summary.paymentBreakdown.map((p) => `
    <tr>
      <td>${PAYMENT_LABELS[p.method] ?? p.method}</td>
      <td class="text-right">${p.count}</td>
      <td class="text-right text-bold">${fmt(p.amount, cur)}</td>
    </tr>`).join('');

  const saleRows = sales.map((s) => {
    const badgeClass = s.status === 'COMPLETED' ? 'badge-completed'
      : s.status === 'VOIDED' ? 'badge-voided'
      : s.status === 'REFUNDED' ? 'badge-refunded' : 'badge-partial';
    return `
    <tr>
      <td>${fmtDate(s.createdAt)}</td>
      <td class="text-bold">${s.receiptNumber}</td>
      <td><span class="badge ${badgeClass}">${STATUS_LABELS[s.status] ?? s.status}</span></td>
      <td>${s.cashierName}</td>
      <td>${s.customerName ?? '—'}</td>
      <td class="text-right">${s.itemCount}</td>
      <td class="text-right">${s.paymentMethods.split(', ').map((m) => PAYMENT_LABELS[m] ?? m).join(', ')}</td>
      <td class="text-right text-bold">${fmt(s.totalAmount, cur)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${baseStyle}</style></head><body><div class="page">
    ${header(shop, 'RAPPORT DES VENTES', periodLabel)}
    <div class="kpi-grid">
      <div class="kpi accent"><div class="kpi-label">Chiffre d'affaires</div>
        <div class="kpi-value">${fmt(summary.totalRevenue, cur)}</div></div>
      <div class="kpi"><div class="kpi-label">Transactions</div>
        <div class="kpi-value">${summary.transactionCount}</div>
        <div class="kpi-sub">${summary.voidedCount} annulée(s)</div></div>
      <div class="kpi"><div class="kpi-label">Panier moyen</div>
        <div class="kpi-value">${fmt(summary.averageBasket, cur)}</div></div>
      <div class="kpi"><div class="kpi-label">Remises accordées</div>
        <div class="kpi-value">${fmt(summary.totalDiscounts, cur)}</div></div>
      <div class="kpi green"><div class="kpi-label">Montant encaissé</div>
        <div class="kpi-value">${fmt(summary.totalPaid, cur)}</div></div>
    </div>
    <h2>Répartition par mode de paiement</h2>
    <table><thead><tr><th>Mode</th><th class="text-right">Transactions</th><th class="text-right">Montant</th></tr></thead>
    <tbody>${paymentRows}</tbody></table>
    <h2>Détail des ventes</h2>
    <table><thead><tr>
      <th>Date</th><th>Reçu</th><th>Statut</th><th>Caissier</th><th>Client</th>
      <th class="text-right">Articles</th><th>Paiement</th><th class="text-right">Montant</th>
    </tr></thead><tbody>${saleRows}</tbody></table>
    ${footer()}
  </div></body></html>`;
}

function buildFinancialHtml(data: FinancialReportData): string {
  const { shop, from, to } = data;
  const cur = shop.currency;
  const periodLabel = `${fmtDay(from)} → ${fmtDay(to)}`;
  const resultColor = data.isProfit ? '#15803d' : '#dc2626';

  const expenseRows = data.expenses.byCategory.map((e) => `
    <tr>
      <td>${EXPENSE_LABELS[e.category] ?? e.category}</td>
      <td class="text-right">${fmt(e.amount, cur)}</td>
      <td class="text-right">${data.expenses.total > 0 ? ((e.amount / data.expenses.total) * 100).toFixed(1) + '%' : '0%'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${baseStyle}
    .pnl-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
    .pnl-label { color:#475569; }
    .pnl-value { font-weight:700; }
    .pnl-section { background:#f8fafc; border-radius:6px; padding:12px 16px; margin:8px 0; }
  </style></head><body><div class="page">
    ${header(shop, 'RAPPORT FINANCIER', periodLabel)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div>
        <h2>Compte de résultat</h2>
        <div class="pnl-section">
          <div class="pnl-row"><span class="pnl-label">CA brut</span><span class="pnl-value">${fmt(data.revenue.gross, cur)}</span></div>
          <div class="pnl-row"><span class="pnl-label">Remises</span><span class="pnl-value" style="color:#ef4444">- ${fmt(data.revenue.discounts, cur)}</span></div>
          <div class="pnl-row"><span class="pnl-label">CA net</span><span class="pnl-value">${fmt(data.revenue.net, cur)}</span></div>
          <div class="pnl-row"><span class="pnl-label">Coût des marchandises (COGS)</span><span class="pnl-value" style="color:#ef4444">- ${fmt(data.cogs, cur)}</span></div>
          <div class="pnl-row"><span class="pnl-label">Marge brute (${data.grossMarginRate.toFixed(1)}%)</span>
            <span class="pnl-value" style="color:${data.grossMargin >= 0 ? '#15803d' : '#dc2626'}">${fmt(data.grossMargin, cur)}</span></div>
          <div class="pnl-row"><span class="pnl-label">Total charges</span><span class="pnl-value" style="color:#ef4444">- ${fmt(data.expenses.total, cur)}</span></div>
          <div class="pnl-row" style="border:none;padding-top:12px;">
            <span style="font-weight:800;font-size:13px;">RÉSULTAT NET</span>
            <span style="font-weight:800;font-size:16px;color:${resultColor};">${fmt(data.netResult, cur)}</span>
          </div>
        </div>
      </div>
      <div>
        <h2>Charges par catégorie</h2>
        <table><thead><tr><th>Catégorie</th><th class="text-right">Montant</th><th class="text-right">Part</th></tr></thead>
        <tbody>${expenseRows}
          <tr class="summary-row"><td>TOTAL</td><td class="text-right">${fmt(data.expenses.total, cur)}</td><td class="text-right">100%</td></tr>
        </tbody></table>
      </div>
    </div>
    ${footer()}
  </div></body></html>`;
}

function buildStockHtml(data: StockReportData): string {
  const { shop, summary, products } = data;
  const cur = shop.currency;

  const productRows = products.map((p) => `
    <tr>
      <td class="text-bold">${p.name}</td>
      <td>${p.sku ?? '—'}</td>
      <td>${p.categoryName ?? '—'}</td>
      <td>${p.unitName ?? '—'}</td>
      <td class="text-right">${p.stockQty}</td>
      <td class="text-right">${p.minStockQty}</td>
      <td class="text-right">${fmt(p.buyingPrice, cur)}</td>
      <td class="text-right">${fmt(p.sellingPrice, cur)}</td>
      <td class="text-right text-bold">${fmt(p.stockValue, cur)}</td>
      <td><span class="badge badge-${p.status.toLowerCase()}">${p.status === 'OK' ? 'OK' : p.status === 'LOW' ? 'Bas' : 'Rupture'}</span></td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${baseStyle}</style></head><body><div class="page">
    ${header(shop, 'RAPPORT DE STOCK', `Généré le ${fmtDate(data.generatedAt)}`)}
    <div class="kpi-grid">
      <div class="kpi accent"><div class="kpi-label">Valeur totale du stock</div>
        <div class="kpi-value">${fmt(summary.totalStockValue, cur)}</div></div>
      <div class="kpi"><div class="kpi-label">Produits actifs</div>
        <div class="kpi-value">${summary.totalProducts}</div></div>
      <div class="kpi orange"><div class="kpi-label">Stock bas</div>
        <div class="kpi-value">${summary.lowStockCount}</div></div>
      <div class="kpi red"><div class="kpi-label">En rupture</div>
        <div class="kpi-value">${summary.outOfStockCount}</div></div>
    </div>
    <h2>Détail des produits</h2>
    <table><thead><tr>
      <th>Produit</th><th>SKU</th><th>Catégorie</th><th>Unité</th>
      <th class="text-right">Qté</th><th class="text-right">Min</th>
      <th class="text-right">Prix achat</th><th class="text-right">Prix vente</th>
      <th class="text-right">Valeur stock</th><th>Statut</th>
    </tr></thead><tbody>${productRows}</tbody></table>
    ${footer()}
  </div></body></html>`;
}

function buildDebtsHtml(data: DebtsReportData): string {
  const { shop, summary, customers } = data;
  const cur = shop.currency;

  const rows = customers.map((c) => `
    <tr>
      <td class="text-bold">${c.name}</td>
      <td>${c.phone ?? '—'}</td>
      <td class="text-right text-bold" style="color:#dc2626;">${fmt(c.totalDebt, cur)}</td>
      <td class="text-right">${c.creditLimit != null ? fmt(c.creditLimit, cur) : '—'}</td>
      <td>${c.isOverLimit ? '<span class="badge badge-out">Dépassé</span>' : '<span class="badge badge-ok">OK</span>'}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>${baseStyle}</style></head><body><div class="page">
    ${header(shop, 'RAPPORT DES CRÉANCES CLIENTS', `Généré le ${fmtDate(data.generatedAt)}`)}
    <div class="kpi-grid">
      <div class="kpi red"><div class="kpi-label">Total des dettes</div>
        <div class="kpi-value">${fmt(summary.totalDebt, cur)}</div></div>
      <div class="kpi"><div class="kpi-label">Clients débiteurs</div>
        <div class="kpi-value">${summary.totalCustomers}</div></div>
      <div class="kpi orange"><div class="kpi-label">Plafond dépassé</div>
        <div class="kpi-value">${summary.overLimitCount}</div></div>
    </div>
    <h2>Détail par client</h2>
    <table><thead><tr>
      <th>Nom</th><th>Téléphone</th><th class="text-right">Dette</th><th class="text-right">Plafond</th><th>Statut</th>
    </tr></thead>
    <tbody>${rows}
      <tr class="summary-row"><td colspan="2">TOTAL</td>
        <td class="text-right">${fmt(summary.totalDebt, cur)}</td><td></td><td></td></tr>
    </tbody></table>
    ${footer()}
  </div></body></html>`;
}

// ── Service principal ─────────────────────────────────────────────────────────

@Injectable()
export class PdfGenerator {
  private async htmlToBuffer(html: string): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  generateSales(data: SalesReportData):    Promise<Buffer> { return this.htmlToBuffer(buildSalesHtml(data)); }
  generateFinancial(data: FinancialReportData): Promise<Buffer> { return this.htmlToBuffer(buildFinancialHtml(data)); }
  generateStock(data: StockReportData):    Promise<Buffer> { return this.htmlToBuffer(buildStockHtml(data)); }
  generateDebts(data: DebtsReportData):    Promise<Buffer> { return this.htmlToBuffer(buildDebtsHtml(data)); }
}
