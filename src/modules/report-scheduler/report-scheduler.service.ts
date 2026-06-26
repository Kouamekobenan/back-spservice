import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportDataService } from './report-data.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportData: ReportDataService,
    private readonly mailService: MailService,
  ) {}

  // ─── Journalier : tous les jours à 22h ────────────────────────────
  @Cron('0 22 * * *', { name: 'daily-report', timeZone: 'Africa/Abidjan' })
  async sendDailyReports(): Promise<void> {
    this.logger.log('[CRON] Démarrage envoi rapports journaliers...');
    const subscriptions = await this.prisma.reportSubscription.findMany({
      where: { reportType: 'DAILY', isActive: true },
    });
    if (!subscriptions.length) { this.logger.debug('[CRON] Aucun abonnement DAILY actif.'); return; }
    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await this.sendOneDailyReport(sub.id, sub.shopId, sub.email);
      if (ok) sent++;
    }
    this.logger.log(`[CRON] Rapports journaliers : ${sent}/${subscriptions.length} envoyés.`);
  }

  // ─── Hebdomadaire : lundi à 8h ────────────────────────────────────
  @Cron('0 8 * * 1', { name: 'weekly-report', timeZone: 'Africa/Abidjan' })
  async sendWeeklyReports(): Promise<void> {
    this.logger.log('[CRON] Démarrage envoi rapports hebdomadaires...');
    const subscriptions = await this.prisma.reportSubscription.findMany({
      where: { reportType: 'WEEKLY', isActive: true },
    });
    if (!subscriptions.length) { this.logger.debug('[CRON] Aucun abonnement WEEKLY actif.'); return; }
    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await this.sendOneWeeklyReport(sub.id, sub.shopId, sub.email);
      if (ok) sent++;
    }
    this.logger.log(`[CRON] Rapports hebdo : ${sent}/${subscriptions.length} envoyés.`);
  }

  // ─── Mensuel : 1er du mois à 8h ──────────────────────────────────
  @Cron('0 8 1 * *', { name: 'monthly-report', timeZone: 'Africa/Abidjan' })
  async sendMonthlyReports(): Promise<void> {
    this.logger.log('[CRON] Démarrage envoi rapports mensuels...');
    const subscriptions = await this.prisma.reportSubscription.findMany({
      where: { reportType: 'MONTHLY', isActive: true },
    });
    if (!subscriptions.length) { this.logger.debug('[CRON] Aucun abonnement MONTHLY actif.'); return; }
    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await this.sendOneMonthlyReport(sub.id, sub.shopId, sub.email);
      if (ok) sent++;
    }
    this.logger.log(`[CRON] Rapports mensuels : ${sent}/${subscriptions.length} envoyés.`);
  }

  // ─── Low-stock : tous les jours à 7h ──────────────────────────────
  @Cron('0 7 * * *', { name: 'low-stock-alert', timeZone: 'Africa/Abidjan' })
  async sendLowStockAlerts(): Promise<void> {
    this.logger.log('[CRON] Vérification des stocks bas...');
    const subscriptions = await this.prisma.reportSubscription.findMany({
      where: { reportType: 'LOW_STOCK', isActive: true },
    });
    if (!subscriptions.length) { this.logger.debug('[CRON] Aucun abonnement LOW_STOCK actif.'); return; }
    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await this.sendOneLowStockAlert(sub.shopId, sub.email);
      if (ok) {
        await this.prisma.reportSubscription.update({ where: { id: sub.id }, data: { lastSentAt: new Date() } });
        sent++;
      }
    }
    this.logger.log(`[CRON] Alertes stock bas : ${sent}/${subscriptions.length} envoyées.`);
  }

  // ─── Méthodes privées : envoi pour UN seul abonnement ─────────────

  private async sendOneDailyReport(subId: string, shopId: string, email: string): Promise<boolean> {
    try {
      const data = await this.reportData.getDailyReport(shopId);
      await this.mailService.sendReportMail({
        to: email,
        subject: `Rapport Journalier — ${data.shopName}`,
        template: 'daily/daily-report',
        context: { ...data, year: new Date().getFullYear() },
      });
      await this.prisma.reportSubscription.update({ where: { id: subId }, data: { lastSentAt: new Date() } });
      return true;
    } catch (err) {
      this.logger.error(`[CRON] Échec rapport journalier shopId=${shopId} → ${email}`, err);
      return false;
    }
  }

  private async sendOneWeeklyReport(subId: string, shopId: string, email: string): Promise<boolean> {
    try {
      const data = await this.reportData.getWeeklyReport(shopId);
      await this.mailService.sendReportMail({
        to: email,
        subject: `Rapport Hebdomadaire — ${data.shopName}`,
        template: 'weekly/weekly-report',
        context: { ...data, year: new Date().getFullYear() },
      });
      await this.prisma.reportSubscription.update({ where: { id: subId }, data: { lastSentAt: new Date() } });
      return true;
    } catch (err) {
      this.logger.error(`[CRON] Échec rapport hebdo shopId=${shopId} → ${email}`, err);
      return false;
    }
  }

  private async sendOneMonthlyReport(subId: string, shopId: string, email: string): Promise<boolean> {
    try {
      const data = await this.reportData.getMonthlyReport(shopId);
      await this.mailService.sendReportMail({
        to: email,
        subject: `Rapport Mensuel ${data.monthLabel} — ${data.shopName}`,
        template: 'monthly/monthly-report',
        context: { ...data, year: new Date().getFullYear() },
      });
      await this.prisma.reportSubscription.update({ where: { id: subId }, data: { lastSentAt: new Date() } });
      return true;
    } catch (err) {
      this.logger.error(`[CRON] Échec rapport mensuel shopId=${shopId} → ${email}`, err);
      return false;
    }
  }

  private async sendOneLowStockAlert(shopId: string, email: string): Promise<boolean> {
    try {
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      const lowStockProducts = await this.prisma.product.findMany({
        where: { shopId, isActive: true },
        include: { unit: true },
      });

      const alerts = lowStockProducts
        .filter((p) => Number(p.stockQty) <= Number(p.minStockQty ?? 5))
        .map((p) => ({
          name: p.name,
          currentStock: Math.round(Number(p.stockQty) * 100) / 100,
          unit: p.unit?.name ?? 'unité',
        }));

      if (!alerts.length) {
        this.logger.debug(`[CRON] Aucun stock bas pour shopId=${shopId} — alerte ignorée.`);
        return false;
      }

      await this.mailService.sendLowStockAlert({
        to: email,
        shopName: shop?.name ?? 'Boutique',
        products: alerts,
      });
      this.logger.log(`[CRON] Alerte stock bas envoyée → ${email} (${alerts.length} produit(s))`);
      return true;
    } catch (err) {
      this.logger.error(`[CRON] Échec alerte stock bas shopId=${shopId} → ${email}`, err);
      return false;
    }
  }

  // ─── Envoi manuel ciblé (test / re-send pour UN seul abonnement) ──
  async sendReportNow(subscriptionId: string): Promise<{ sent: boolean; message: string }> {
    const sub = await this.prisma.reportSubscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: { shop: { select: { name: true } } },
    });

    let sent = false;
    switch (sub.reportType) {
      case 'DAILY':
        sent = await this.sendOneDailyReport(sub.id, sub.shopId, sub.email);
        break;
      case 'WEEKLY':
        sent = await this.sendOneWeeklyReport(sub.id, sub.shopId, sub.email);
        break;
      case 'MONTHLY':
        sent = await this.sendOneMonthlyReport(sub.id, sub.shopId, sub.email);
        break;
      case 'LOW_STOCK':
        sent = await this.sendOneLowStockAlert(sub.shopId, sub.email);
        if (sent) await this.prisma.reportSubscription.update({ where: { id: sub.id }, data: { lastSentAt: new Date() } });
        break;
    }

    return {
      sent,
      message: sent
        ? `Rapport ${sub.reportType} envoyé à ${sub.email} pour ${sub.shop.name}`
        : `Aucun envoi — pas de données (stock suffisant ou données vides)`,
    };
  }
}
