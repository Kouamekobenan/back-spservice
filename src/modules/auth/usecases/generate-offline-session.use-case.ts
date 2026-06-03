import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../users/application/interfaces/user.interface.repository.js';
import { AuthService } from '../services/auth.service.js';
import { OfflineSessionResponseDto } from '../dtos/offline-auth.dto.js';

@Injectable()
export class GenerateOfflineSessionUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(userId: string): Promise<OfflineSessionResponseDto> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

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
        name: user.getName() ?? '',
        role: user.getRole(),
        pin: user.getPin(),
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
