import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppMessagePayload {
  to: string;
  message: string;
  mediaUrl?: string;
}

/**
 * WhatsAppService — Compatible mode offline
 *
 * En mode offline (DATABASE_PROVIDER=sqlite) :
 *   - onModuleInit() → ne lève PAS d'erreur si les variables manquent
 *   - sendMessage()  → no-op silencieux (log debug uniquement)
 *
 * En mode cloud (défaut) :
 *   - Comportement identique à l'original (UltraMsg API)
 */
@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private baseUrl!: string;
  private token!: string;
  private isOffline = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const provider = this.configService.get<string>('DATABASE_PROVIDER', 'postgres');
    this.isOffline = provider === 'sqlite';

    if (this.isOffline) {
      this.logger.warn(
        '⚠️  WhatsAppService désactivé (mode offline — DATABASE_PROVIDER=sqlite)',
      );
      return; // Ne pas lever d'erreur si ULTRAMSG_* manquent
    }

    // Mode cloud : validation des variables requises
    const baseUrl = this.configService.get<string>('ULTRAMSG_API_URL');
    const token = this.configService.get<string>('ULTRAMSG_TOKEN');

    if (!baseUrl || !token) {
      throw new Error(
        '❌ Configuration UltraMsg manquante : ULTRAMSG_API_URL et ULTRAMSG_TOKEN sont requis.',
      );
    }

    this.baseUrl = baseUrl.replace(/\/$/, ''); // Retire le slash final si présent
    this.token = token;
    this.logger.log(`✅ WhatsAppService initialisé — URL: ${this.baseUrl}`);
  }

  async sendMessage(payload: WhatsAppMessagePayload): Promise<void> {
    // Mode offline : no-op silencieux
    if (this.isOffline) {
      this.logger.debug(
        `[OFFLINE] WhatsApp simulé vers ${payload.to}: "${payload.message.substring(0, 50)}..."`,
      );
      return;
    }

    // Mode cloud : envoi réel via UltraMsg
    const { to, message, mediaUrl } = payload;
    const endpoint = mediaUrl ? 'messages/document' : 'messages/chat';
    const url = `${this.baseUrl}/${endpoint}`;

    const body: Record<string, string> = {
      token: this.token,
      to,
      body: message,
    };

    if (mediaUrl) {
      body.document = mediaUrl;
      body.filename = 'Ticket_VisaForCulture.pdf';
    }

    this.logger.debug(`Envoi WhatsApp vers ${to} via ${endpoint}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `UltraMsg API error [${response.status}]: ${errorText}`,
      );
    }

    const result = await response.json();
    this.logger.debug(`Réponse UltraMsg: ${JSON.stringify(result)}`);

    if (result?.sent !== 'true') {
      throw new Error(
        `UltraMsg a rejeté le message: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(`✅ Message WhatsApp envoyé avec succès à ${to}`);
  }
}
