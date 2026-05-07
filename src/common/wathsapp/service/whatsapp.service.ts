import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppMessagePayload {
  to: string;
  message: string;
  mediaUrl?: string;
}
@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private baseUrl!: string;
  private token!: string;
  constructor(private readonly configService: ConfigService) {}
  onModuleInit() {
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
      throw new InternalServerErrorException(
        `UltraMsg API error [${response.status}]: ${errorText}`,
      );
    }
    const result = await response.json();
    this.logger.debug(`Réponse UltraMsg: ${JSON.stringify(result)}`); // ← ajoute ça
    // UltraMsg retourne { sent: "true" } en cas de succès
    if (result?.sent !== 'true') {
      throw new InternalServerErrorException(
        `UltraMsg a rejeté le message: ${JSON.stringify(result)}`,
      );
    }
    this.logger.log(` Message WhatsApp envoyé avec succès à ${to}`);
  }
}
