import { Injectable, Inject, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { IUserRepository } from '../users/application/interfaces/user.interface.repository.js';
import { User } from '../users/domain/entities/user.entity.js';
import { AuthService } from '../services/auth.service.js';
import { OfflineSessionResponseDto } from '../dtos/offline-auth.dto.js';

@Injectable()
export class PinLoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  /**
   * Connexion par PIN — même logique d'identification que le login normal :
   * accepte phone OU username comme identifiant, avec le PIN comme secret.
   */
  async execute(
    identifier: string,   // phone ou username
    pin: string,
  ): Promise<OfflineSessionResponseDto> {
    if (!identifier?.trim()) {
      throw new BadRequestException('Un identifiant (téléphone ou username) est requis');
    }

    const isPhone = identifier.startsWith('+') || /^\d{7,15}$/.test(identifier);

    let user: User | null = null;

    if (isPhone) {
      user = await this.userRepository.findByPhone(identifier);

      if (!user && identifier.startsWith('+225')) {
        user = await this.userRepository.findByPhone(identifier.slice(4));
      }

      if (!user && !identifier.startsWith('+')) {
        user = await this.userRepository.findByPhone('+225' + identifier);
      }

      if (!user) {
        user = await this.userRepository.findByUsername(identifier);
      }
    } else {
      user = await this.userRepository.findByUsername(identifier);
      if (!user) user = await this.userRepository.findByPhone(identifier);
    }

    if (!user) throw new NotFoundException('Identifiants incorrects');

    if (!user.getIsActive()) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const storedPin = user.getPin();
    if (!storedPin) {
      throw new UnauthorizedException('Aucun PIN configuré pour cet utilisateur');
    }

    // Comparaison bcrypt si le PIN est hashé, sinon comparaison directe
    const isBcrypt = storedPin.startsWith('$2');
    const isValid = isBcrypt
      ? await bcrypt.compare(pin, storedPin)
      : storedPin === pin;

    if (!isValid) throw new UnauthorizedException('PIN incorrect');

    const offlineToken = await this.authService.generateOfflineToken({
      userId: user.getId(),
      phone:  user.getPhone() ?? undefined,
      role:   user.getRole(),
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      offlineToken,
      expiresAt,
      user: {
        id:       user.getId(),
        username: user.getUsername(),
        name:     user.getName(),
        role:     user.getRole(),
        pin:      storedPin,
        phone:    user.getPhone(),
        shopAccesses: user.getShopAccesses().map((a) => ({
          shopId:     a.shopId,
          shopName:   a.shop?.getName() ?? '',
          roleInShop: a.roleInShop ?? null,
        })),
      },
    };
  }
}
