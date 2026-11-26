import { Injectable } from '@nestjs/common';
import { getBrowser } from '../../../../common/print/browser.pool.js';
import type { QuotePrintContext } from '../../domain/interfaces/quote.repository.interface.js';

const fmt = (n: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(d);

/** Échappe les caractères HTML pour éviter toute injection dans le PDF généré. */
const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
  CONVERTED: 'Converti en vente',
};

@Injectable()
export class QuotePdfGenerator {
  async generate(context: QuotePrintContext): Promise<Buffer> {
    const html = this.buildHtml(context);
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' },
      });
      return Buffer.from(pdfBytes);
    } finally {
      await page.close();
    }
  }

  private buildHtml(ctx: QuotePrintContext): string {
    const { quote } = ctx;
    const shop = {
      ...ctx.shop,
      name: esc(ctx.shop.name),
      address: ctx.shop.address ? esc(ctx.shop.address) : ctx.shop.address,
      phone: ctx.shop.phone ? esc(ctx.shop.phone) : ctx.shop.phone,
      email: ctx.shop.email ? esc(ctx.shop.email) : ctx.shop.email,
      taxId: ctx.shop.taxId ? esc(ctx.shop.taxId) : ctx.shop.taxId,
    };
    const authorName = ctx.authorName ? esc(ctx.authorName) : ctx.authorName;
    const cur = shop.currency || 'XOF';
    const items = quote.getItems();

    const rowsHtml = items
      .map(
        (item, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>
          <div class="prod-name">${esc(item.productName)}</div>
          ${item.productSku ? `<div class="prod-sku">Réf : ${esc(item.productSku)}</div>` : ''}
        </td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${fmt(item.unitPrice, cur)}</td>
        <td class="text-right">${item.discount > 0 ? fmt(item.discount, cur) : '—'}</td>
        <td class="text-right text-bold">${fmt(item.totalPrice, cur)}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Devis ${quote.getQuoteNumber()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
    .container { padding: 8px 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
    .shop-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .shop-info { color: #475569; font-size: 10px; line-height: 1.6; margin-top: 6px; }
    .doc-box { text-align: right; }
    .doc-type { font-size: 20px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-number { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .doc-meta { font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.5; }
    .parties { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    .party-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
    .party-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin-bottom: 6px; }
    .party-name { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .party-detail { font-size: 10px; color: #475569; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f172a; color: #ffffff; padding: 9px 10px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; text-align: left; }
    td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .prod-name { font-weight: 600; color: #0f172a; }
    .prod-sku { font-size: 9px; color: #64748b; margin-top: 2px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-bold { font-weight: 700; }
    .totals-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-top: 10px; }
    .notes-box { flex: 1.2; background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px 14px; border-radius: 4px; font-size: 10px; color: #334155; line-height: 1.5; }
    .notes-title { font-weight: 700; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; font-size: 9px; }
    .totals-table { flex: 0.8; width: 260px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
    .totals-row.grand-total { background: #0f172a; color: #ffffff; font-size: 13px; font-weight: 800; border-bottom: none; padding: 11px 14px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 36px; gap: 40px; }
    .sig-box { flex: 1; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; height: 95px; }
    .sig-title { font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; }
    .sig-sub { font-size: 8.5px; color: #94a3b8; margin-top: 2px; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; color: #94a3b8; font-size: 9px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="shop-name">${shop.name}</div>
        <div class="shop-info">
          ${shop.address ? `<div>${shop.address}</div>` : ''}
          ${shop.phone ? `<div>Tél : ${shop.phone}</div>` : ''}
          ${shop.email ? `<div>Email : ${shop.email}</div>` : ''}
          ${shop.taxId ? `<div>Identifiant fiscal / NINEA : ${shop.taxId}</div>` : ''}
        </div>
      </div>
      <div class="doc-box">
        <div class="doc-type">Devis / Proforma</div>
        <div class="doc-number">N° ${quote.getQuoteNumber()}</div>
        <div class="doc-meta">
          <div>Date d'émission : <strong>${fmtDate(quote.getCreatedAt())}</strong></div>
          ${quote.getValidUntil() ? `<div>Valable jusqu'au : <strong>${fmtDate(quote.getValidUntil()!)}</strong></div>` : ''}
          <div>Statut : <strong>${STATUS_LABELS[quote.getStatus()] ?? quote.getStatus()}</strong></div>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party-card">
        <div class="party-title">Établi par</div>
        <div class="party-name">${shop.name}</div>
        <div class="party-detail">
          ${authorName ? `<div>Conseiller / Caissier : ${authorName}</div>` : ''}
          ${shop.phone ? `<div>Contact : ${shop.phone}</div>` : ''}
        </div>
      </div>
      <div class="party-card">
        <div class="party-title">Adressé au client</div>
        <div class="party-name">${esc(quote.getCustomerName() || 'Client Comptoir')}</div>
        <div class="party-detail">
          ${quote.getCustomerPhone() ? `<div>Tél : ${esc(quote.getCustomerPhone())}</div>` : ''}
          ${quote.getCustomerEmail() ? `<div>Email : ${esc(quote.getCustomerEmail())}</div>` : ''}
          ${quote.getCustomerAddress() ? `<div>Adresse : ${esc(quote.getCustomerAddress())}</div>` : ''}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 36px;" class="text-center">#</th>
          <th>Désignation du produit</th>
          <th style="width: 75px;" class="text-right">Quantité</th>
          <th style="width: 105px;" class="text-right">Prix Unitaire</th>
          <th style="width: 90px;" class="text-right">Remise / U</th>
          <th style="width: 115px;" class="text-right">Montant Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="notes-box">
        <div class="notes-title">Conditions & Notes</div>
        <div>${quote.getNotes() ? esc(quote.getNotes()) : 'Ce devis est établi à titre indicatif et n’entraîne aucune réservation ni déduction automatique de stock avant validation et règlement.'}</div>
      </div>
      <div class="totals-table">
        <div class="totals-row">
          <span>Sous-total</span>
          <strong>${fmt(quote.getSubtotal(), cur)}</strong>
        </div>
        ${
          quote.getDiscountAmount() > 0
            ? `<div class="totals-row">
                 <span>Remise globale</span>
                 <strong>- ${fmt(quote.getDiscountAmount(), cur)}</strong>
               </div>`
            : ''
        }
        ${
          quote.getTaxAmount() > 0
            ? `<div class="totals-row">
                 <span>Taxe / TVA</span>
                 <strong>+ ${fmt(quote.getTaxAmount(), cur)}</strong>
               </div>`
            : ''
        }
        <div class="totals-row grand-total">
          <span>NET À PAYER</span>
          <span>${fmt(quote.getTotalAmount(), cur)}</span>
        </div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Cachet et signature de la boutique</div>
        <div class="sig-sub">${shop.name}</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Bon pour accord (Signature du client)</div>
        <div class="sig-sub">Date et mention « Lu et approuvé »</div>
      </div>
    </div>

    <div class="footer">
      Document généré par ${shop.name} — Ce devis / facture proforma ne vaut pas reçu de caisse.
    </div>
  </div>
</body>
</html>`;
  }
}
