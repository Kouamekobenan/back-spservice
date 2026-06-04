import { ConflictException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import type { IUserRepository } from '../users/application/interfaces/user.interface.repository.js';
import { UserDto } from '../users/application/dtos/user.dto.js';
import { UserRole } from '../users/domain/enums/role.enum.js';
import type { User } from '../users/domain/entities/user.entity.js';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(userDto: UserDto) {
    // Vérifier doublon par téléphone (si fourni)
    if (userDto.phone) {
      const existingUser = await this.userRepository.findByPhone(userDto.phone);
      if (existingUser) {
        throw new ConflictException('Un compte avec ce numéro existe déjà.');
      }
    }

    // Vérifier doublon par username (si fourni)
    if (userDto.username) {
      const existingByUsername = await this.userRepository.findByUsername(userDto.username);
      if (existingByUsername) {
        throw new ConflictException("Ce nom d'utilisateur est déjà pris.");
      }
    }

    // Accepte "password" ou "passwordHash" — quel que soit le nom envoyé par le frontend
    const plainPassword = userDto.password || userDto.passwordHash;
    if (!plainPassword) {
      throw new ConflictException('Le mot de passe est obligatoire.');
    }
    const hashedPassword = await this.authService.hashPassword(plainPassword);

    // Valeurs par défaut pour les champs optionnels
    const username = userDto.username?.trim() || `user_${Date.now()}`;
    const role     = userDto.role     ?? UserRole.CASHIER;
    const isActive = userDto.isActive ?? true;

    let newUser: User;
    try {
      newUser = await this.userRepository.createUser({
        ...userDto,
        username,
        passwordHash: hashedPassword,
        role,
        isActive,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Échec de la création du compte : ${message}`);
    }

    const { accessToken, refreshToken } = await this.authService.generateTokens({
      userId: newUser.getId(),
      phone:  newUser.getPhone() ?? '',
      role:   newUser.getRole(),
    });

    return {
      message: 'Compte créé avec succès.',
      accessToken,
      refreshToken,
      tokens: { accessToken, refreshToken },
      token:  { accessToken, refreshToken },
    };
  }
}
