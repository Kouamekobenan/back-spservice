import { Inject, Injectable, Logger } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { CreateShopDto } from '../dtos/create-shop-dto.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction, Role } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { UserAccessCache } from '../../../auth/strategies/user-access.cache.js';

@Injectable()
export class CreateShopUseCase {
  private readonly logger = new Logger(CreateShopUseCase.name);

  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async execute(data: CreateShopDto, creatorUserId?: string): Promise<Shop> {
    try {
      const shop = await this.shopRepository.createShop(data);
      const targetUserId = creatorUserId || data.userId;

      // ─── Attribution automatique des droits d'accès à la boutique ───
      if (targetUserId) {
        try {
          await this.prisma.userShopAccess.upsert({
            where: {
              userId_shopId: {
                userId: targetUserId,
                shopId: shop.getId(),
              },
            },
            create: {
              userId: targetUserId,
              shopId: shop.getId(),
              roleInShop: Role.ADMIN,
            },
            update: {
              roleInShop: Role.ADMIN,
            },
          });
          UserAccessCache.invalidate(targetUserId);
          this.logger.log(`Accès ADMIN automatiquement attribué à l'utilisateur ${targetUserId} pour la boutique ${shop.getId()}`);
        } catch (accessError) {
          this.logger.warn(`Impossible d'attribuer l'accès à la boutique pour ${targetUserId}: ${accessError instanceof Error ? accessError.message : accessError}`);
        }
      }

      // Émission de l'événement d'audit
      this.eventEmitter.emit(
        'audit.created',
        new AuditEvent(
          AuditAction.CREATE,
          'Shop',
          shop.getId(),
          targetUserId || 'SYSTEM',
          shop.getId(),
          undefined,
          shop,
          undefined,
          undefined,
          `Boutique "${shop.getName()}" créée.${targetUserId ? ` Accès ADMIN assigné à l'utilisateur ${targetUserId}.` : ''}`,
        ),
      );

      return shop;
    } catch (error) {
      this.logger.error('Erreur lors de la création de la boutique', error);
      throw error;
    }
  }
}
