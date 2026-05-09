import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {type IUserRepository } from '../users/application/interfaces/user.interface.repository';
import { UserDto } from '../users/application/dtos/user.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService, // ✅ convention camelCase cohérente
    // private readonly mailService: MailService,
  ) {}

  async execute(userDto: UserDto) {
    const existingUser = await this.userRepository.findByPhone(
      userDto.phone ?? '',
    );

    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà.');
    }

    // 2. Hasher le mot de passe
    const hashedPassword = await this.authService.hashPassword(
      userDto.passwordHash,
    );

    let newUser;
    try {
      newUser = await this.userRepository.createUser({
        ...userDto,
        passwordHash: hashedPassword,
      });
    } catch (error) {
      // On log et on relance une erreur HTTP explicite
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Échec de la création du compte : ${message}`,
      );
    }

    // 4. Générer les tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      {
        userId: newUser.getId(),
        phone: newUser.getPhone() ?? '',
        role: newUser.getRole(),
      },
    );
  
    return {
      message: 'Compte créé avec succès.',
      tokens: { accessToken, refreshToken },
    };
  }
}
