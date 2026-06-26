import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface WelcomeMailOptions {
  to: string;
  name: string;
  shopName: string;
  role: string;
}

export interface ResetPasswordMailOptions {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface LowStockAlertMailOptions {
  to: string;
  shopName: string;
  products: { name: string; currentStock: number; unit: string }[];
}

export interface SaleReceiptMailOptions {
  to: string;
  customerName: string;
  shopName: string;
  receiptNumber: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  totalAmount: number;
  paymentMethod: string;
  date: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailer: MailerService) {}
  async sendWelcomeMail(options: WelcomeMailOptions): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: `Bienvenue sur SP Service — ${options.shopName}`,
        template: 'welcome/welcome',
        context: {
          name: options.name,
          shopName: options.shopName,
          role: options.role,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Échec envoi welcome mail à ${options.to}`, error);
      throw error;
    }
  }

  async sendResetPasswordMail(options: ResetPasswordMailOptions): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: 'SP Service — Réinitialisation de mot de passe',
        template: 'reset-password/reset-password',
        context: {
          name: options.name,
          resetUrl: options.resetUrl,
          expiresInMinutes: options.expiresInMinutes,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Échec envoi reset-password à ${options.to}`, error);
      throw error;
    }
  }

  async sendLowStockAlert(options: LowStockAlertMailOptions): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: `[Alerte Stock] ${options.shopName} — Produits en rupture`,
        template: 'low-stock/low-stock',
        context: {
          shopName: options.shopName,
          products: options.products,
          count: options.products.length,
          date: new Date().toLocaleDateString('fr-FR'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Échec envoi low-stock alert`, error);
      throw error;
    }
  }

  async sendSaleReceipt(options: SaleReceiptMailOptions): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: `Reçu #${options.receiptNumber} — ${options.shopName}`,
        template: 'sale-receipt/sale-receipt',
        context: {
          customerName: options.customerName,
          shopName: options.shopName,
          receiptNumber: options.receiptNumber,
          items: options.items,
          totalAmount: options.totalAmount.toLocaleString('fr-FR'),
          paymentMethod: options.paymentMethod,
          date: options.date,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Échec envoi reçu vente #${options.receiptNumber}`, error);
      throw error;
    }
  }

  async sendReportMail(options: { to: string; subject: string; template: string; context: Record<string, any> }): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });
    } catch (error) {
      this.logger.error(`Échec envoi rapport à ${options.to}`, error);
      throw error;
    }
  }
}
