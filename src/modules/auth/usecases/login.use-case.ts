import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {type IUserRepository } from '../users/application/interfaces/user.interface.repository';
import { User } from '../users/domain/entities/user.entity';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LoginUserUseCase {
  private readonly logger = new Logger(LoginUserUseCase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(
    phone: string,
    password: string,
  ): Promise<{
    user: User;
    token: { accessToken: string; refreshToken: string };
  }> {
    // 🔍 1️⃣ Vérifie si l'utilisateur existe
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundException(
        `Aucun utilisateur trouvé avec ce numéro de telephone ${phone}`,
      );
    }

    // 🔐 2️⃣ Vérifie le mot de passe
    const isPasswordValid = await this.authService.comparePassword(
      password,
      user.getPassword() ?? '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // 🪪 3️⃣ Génère les tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      {
        userId: user.getId(),
        phone: user.getPhone() ?? '',
        role: user.getRole(),
      },
    );

    // 🔒 4️⃣ Hashe le refresh token avant de le sauvegarder
    const hashedRt = await this.authService.hashRefreshToken(refreshToken);
    const users = await this.userRepository.updateRefreshToken(
      user.getId(),
      hashedRt,
    );
    console.log(`User with resh: ${users.getRefreshToken()}`);

    this.logger.log(
      `Connexion réussie pour l'utilisateur avec le numéro ${phone}`,
    );

    //  4️⃣ Retourne le résultat
    return { user, token: { accessToken, refreshToken } };
  }
}
