import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * PrismaService — Dual Provider (PostgreSQL cloud + SQLite offline)
 *
 * Bascule automatiquement entre les deux providers selon DATABASE_PROVIDER :
 *   - "sqlite"   → client SQLite (.prisma/client-sqlite) + PRAGMAs
 *   - "postgres" → client PostgreSQL (@prisma/client) [défaut]
 *
 * ⚠️  PATTERN COMPOSITION + PROXY :
 *   Le service ne hérite plus de PrismaClient (breaking change volontaire).
 *   Il expose un Proxy transparent vers le client actif, donc tous les
 *   repositories existants (this.prisma.product.findMany(), etc.) continuent
 *   de fonctionner SANS AUCUNE MODIFICATION.
 *
 *   Exemple : this.prisma.sale.create(...)
 *     → intercepté par le Proxy
 *     → délégué à this.client.sale.create(...)
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Client Prisma actif (PostgreSQL ou SQLite selon DATABASE_PROVIDER)
  private client: any;

  constructor(private readonly configService: ConfigService) {
    // Retourner un Proxy qui délègue dynamiquement toutes les propriétés
    // au client actif. Cela rend le swap de provider totalement transparent
    // pour tous les repositories et use cases.
    return new Proxy(this, {
      get(target, prop: string) {
        // Propriétés propres au service → accès direct
        if (prop in target) {
          const value = (target as any)[prop];
          return typeof value === 'function' ? value.bind(target) : value;
        }
        // Tout le reste → déléguer au client Prisma actif
        if (target.client && prop in target.client) {
          const value = target.client[prop];
          return typeof value === 'function' ? value.bind(target.client) : value;
        }
        return undefined;
      },
    });
  }
  async onModuleInit() {
    const provider = this.configService.get<string>('DATABASE_PROVIDER', 'postgres');

    if (provider === 'sqlite') {
      await this.initSQLite();
    } else {
      await this.initPostgreSQL();
    }
  }

  // ── Initialisation SQLite ─────────────────────────────────

  private async initSQLite() {
    try {
      // Import dynamique du client SQLite généré séparément
      // (npx prisma generate --schema=prisma/schema.sqlite.prisma)
      const { PrismaClient } = await import(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — client généré au moment du build, pas en dev sans generate
        '../../node_modules/.prisma/client-sqlite/index.js' as any
      );

      this.client = new PrismaClient({
        log: process.env.NODE_ENV !== 'production'
          ? ['warn', 'error']
          : ['error'],
        datasources: {
          db: {
            url: this.configService.get<string>('DATABASE_URL_SQLITE'),
          },
        },
      });

      await this.client.$connect();

      // PRAGMAs recommandés pour SQLite en production
      await this.client.$executeRaw`PRAGMA foreign_keys = ON;`;
      await this.client.$executeRaw`PRAGMA journal_mode = WAL;`;
      await this.client.$executeRaw`PRAGMA busy_timeout = 5000;`;
      await this.client.$executeRaw`PRAGMA synchronous = NORMAL;`;

      this.logger.log('🗄️  PrismaService → SQLite (mode offline)');
      this.logger.log(
        `📁 DB: ${this.configService.get<string>('DATABASE_URL_SQLITE')}`,
      );
      this.logger.log('✅ SQLite PRAGMAs: foreign_keys=ON, journal_mode=WAL');
    } catch (error) {
      this.logger.error(
        '❌ Échec de la connexion SQLite. Avez-vous exécuté `npm run prisma:generate:sqlite` et `npm run prisma:push:sqlite` ?',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  // ── Initialisation PostgreSQL ────────────────────────────

  private async initPostgreSQL() {
    try {
      const { PrismaClient } = await import('@prisma/client');

      this.client = new PrismaClient({
        log: process.env.NODE_ENV !== 'production'
          ? ['warn', 'error']
          : ['error'],
      });

      await this.client.$connect();
      this.logger.log('🐘 PrismaService → PostgreSQL (mode cloud)');
    } catch (error) {
      this.logger.error(
        '❌ Échec de la connexion PostgreSQL. Vérifiez DATABASE_URL.',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  // ── Cycle de vie ─────────────────────────────────────────

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
      this.logger.log('🔌 PrismaService déconnecté');
    }
  }

  // ── Méthodes Prisma exposées directement (pour l'autocompletion IDE) ──
  // Note : le Proxy capture TOUTES les propriétés du client automatiquement.
  // Ces getters sont optionnels mais améliorent l'IntelliSense TypeScript.

  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  get $executeRaw() {
    return this.client.$executeRaw.bind(this.client);
  }

  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client);
  }

  get product() { return this.client.product; }
  get sale() { return this.client.sale; }
  get saleItem() { return this.client.saleItem; }
  get salePayment() { return this.client.salePayment; }
  get user() { return this.client.user; }
  get shop() { return this.client.shop; }
  get category() { return this.client.category; }
  get unit() { return this.client.unit; }
  get customer() { return this.client.customer; }
  get creditPayment() { return this.client.creditPayment; }
  get cashSession() { return this.client.cashSession; }
  get supplier() { return this.client.supplier; }
  get purchaseOrder() { return this.client.purchaseOrder; }
  get purchaseOrderItem() { return this.client.purchaseOrderItem; }
  get stockMovement() { return this.client.stockMovement; }
  get stockTransfer() { return this.client.stockTransfer; }
  get stockTransferItem() { return this.client.stockTransferItem; }
  get expense() { return this.client.expense; }
  get auditLog() { return this.client.auditLog; }
  get syncQueue() { return this.client.syncQueue; }
  get shopSetting() { return this.client.shopSetting; }
  get userShopAccess() { return this.client.userShopAccess; }
  get productBatch() { return this.client.productBatch; }
  get productComponent() { return this.client.productComponent; }
  get changeLog() { return this.client.changeLog; }
}