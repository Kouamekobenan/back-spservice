import { Inject, Injectable } from '@nestjs/common';
import { type IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { CreateShopDto } from '../dtos/create-shop-dto.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../../common/events/audit.event.js';
import { AuditAction } from '@prisma/client';

@Injectable()
export class CreateShopUseCase {
  constructor(
    @Inject('IShopRepository')
    private readonly shopRepository: IShopRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(data: CreateShopDto): Promise<Shop> {
    try {
      const shop = await this.shopRepository.createShop(data);

      // Émission de l'événement d'audit
      this.eventEmitter.emit(
        'audit.created',
        new AuditEvent(
          AuditAction.CREATE,
          'Shop',
          shop.getId(),
          'SYSTEM', // Idéalement, récupérez l'ID de l'utilisateur actuel depuis le contexte
          shop.getId(),
          undefined,
          shop,
          undefined,
          undefined,
          `Boutique "${shop.getName()}" créée.`,
        ),
      );

      return shop;
    } catch (error) {
      console.error('Erreur lors de la création de la boutique');
      throw error;
    }
  }
}
