import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import {type IUserRepository } from '../users/application/interfaces/user.interface.repository';
import { AuthService } from '../services/auth.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}
  async execute(userId: string, refreshToken: string) {
    const user = await this.userRepository.getUserById(userId);
    if (!user || !user.getRefreshToken()) {
      throw new UnauthorizedException('Utilisateur non trouvé ou non connecté');
    }

    const isValid = await this.authService.compareHashRefreshToken(
      refreshToken,
      user.getRefreshToken() ?? '',
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const payload = {
      userId: user.getId(),
      role: user.getRole(),
      phone: user.getPhone(),
    };
    // RefreshTokenUseCase.ts
    const tokens = await this.authService.generateTokens({
      userId: user.getId(),
      role: user.getRole(),
        phone: user.getPhone() ?? '',
    });

    const hashedRt = await this.authService.hashRefreshToken(
      tokens.refreshToken,
    );
    await this.userRepository.updateRefreshToken(user.getId(), hashedRt);

    // On renvoie des noms clairs pour le Frontend
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken, // C'est ce token EN CLAIR qui sera stocké
    };
  }
}
