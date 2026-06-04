import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { type IUserRepository } from '../users/application/interfaces/user.interface.repository.js';
import { User } from '../users/domain/entities/user.entity.js';
import { AuthService } from '../services/auth.service.js';

@Injectable()
export class LoginUserUseCase {
  private readonly logger = new Logger(LoginUserUseCase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(
    phoneOrUsername: string,
    password: string,
  ): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    token: { accessToken: string; refreshToken: string };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const isPhone = phoneOrUsername.startsWith('+') || /^\d{7,15}$/.test(phoneOrUsername);

    let user: User | null = null;

    if (isPhone) {
      // Essai 1 : valeur brute
      user = await this.userRepository.findByPhone(phoneOrUsername);

      // Essai 2 : sans le préfixe +225 (ex: "+2250701020304" → "0701020304")
      if (!user && phoneOrUsername.startsWith('+225')) {
        user = await this.userRepository.findByPhone(phoneOrUsername.slice(4));
      }

      // Essai 3 : avec le préfixe +225 (ex: "0701020304" → "+2250701020304")
      if (!user && !phoneOrUsername.startsWith('+')) {
        user = await this.userRepository.findByPhone('+225' + phoneOrUsername);
      }

      // Essai 4 : en dernier recours, chercher par username
      if (!user) {
        user = await this.userRepository.findByUsername(phoneOrUsername);
      }
    } else {
      // Cherche par username d'abord
      user = await this.userRepository.findByUsername(phoneOrUsername);

      // Fallback : peut-être un numéro sans indicatif
      if (!user) {
        user = await this.userRepository.findByPhone(phoneOrUsername);
      }
    }

    if (!user) {
      throw new NotFoundException('Identifiants incorrects');
    }

    if (!user.getIsActive()) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const isPasswordValid = await this.authService.comparePassword(
      password,
      user.getPassword() ?? '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const { accessToken, refreshToken } = await this.authService.generateTokens({
      userId: user.getId(),
      phone:  user.getPhone() ?? '',
      role:   user.getRole(),
    });

    const hashedRt = await this.authService.hashRefreshToken(refreshToken);
    await this.userRepository.updateRefreshToken(user.getId(), hashedRt);
    await this.userRepository.lastConnect(user.getId());

    this.logger.log(`Connexion réussie : ${user.getUsername()} (${user.getRole()})`);

    return {
      user,
      accessToken,
      refreshToken,
      token:  { accessToken, refreshToken },
      tokens: { accessToken, refreshToken },
    };
  }
}
