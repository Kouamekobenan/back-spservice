import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { IUserRepository } from '../users/application/interfaces/user.interface.repository.js';
import { AuthService } from '../services/auth.service.js';
import { OfflineSessionResponseDto } from '../dtos/offline-auth.dto.js';

@Injectable()
export class PinLoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(username: string, pin: string): Promise<OfflineSessionResponseDto> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

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
      phone: user.getPhone() ?? undefined,
      role: user.getRole(),
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      offlineToken,
      expiresAt,
      user: {
        id: user.getId(),
        username: user.getUsername(),
        name: user.getName(),
        role: user.getRole(),
        pin: storedPin,
        phone: user.getPhone(),
        shopAccesses: user.getShopAccesses().map((a) => ({
          shopId: a.shopId,
          shopName: a.shop?.getName() ?? '',
          roleInShop: a.roleInShop ?? null,
        })),
      },
    };
  }
}
