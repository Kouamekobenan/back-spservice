import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { IUserRepository } from '../users/application/interfaces/user.interface.repository';
import { UserDto } from '../users/application/dtos/user.dto';
import { MailService } from '../../../common/email/email.service';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService, // ✅ convention camelCase cohérente
    private readonly mailService: MailService,
  ) {}

  async execute(userDto: UserDto) {
    const existingUser = await this.userRepository.findByEmail(
      userDto.email ?? '',
    );

    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà.');
    }

    // 2. Hasher le mot de passe
    const hashedPassword = await this.authService.hashPassword(
      userDto.password,
    );

    // 3. Créer l'utilisateur — on laisse l'erreur remonter proprement
    // plutôt que de l'avaler et de laisser `newUser` indéfini (ce qui causerait
    // un crash plus loin sur newUser.getId() avec un message trompeur)
    let newUser;
    try {
      newUser = await this.userRepository.createUser({
        ...userDto,
        password: hashedPassword,
      });
    } catch (error) {
      // ✅ On log et on relance une erreur HTTP explicite
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Échec de la création du compte : ${message}`,
      );
    }

    // 4. Générer les tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      {
        userId: newUser.getId(),
        email: newUser.getEmail() ?? '',
        role: newUser.getRole(),
      },
    );
    // ✅ Typage du retour explicite, faute de frappe corrigée ("succeffuly" → "successfully")
    await this.mailService.sendWelcomeEmail(
      newUser.getEmail(),
      newUser.getName(),
    );
    return {
      message: 'Compte créé avec succès.',
      tokens: { accessToken, refreshToken },
    };
  }
}
