import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Patch,
  Param,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../usecases/register.user.use-case';
import { LoginUserUseCase } from '../usecases/login.use-case';
import { UserDto } from '../users/application/dtos/user.dto';
import { LoginDto } from '../users/application/dtos/login-dto.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '../users/domain/entities/user.entity';
import { AuthMeUseCase } from '../usecases/authme.usecase';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/role.guard';
import { LogoutUserUseCase } from '../usecases/logout-user.usecase';
import { UpdateUserUseCase } from '../users/application/usecases/update-user.usecase';
import { Public } from '../../../common/decorators/public.decorator';
import { RefreshTokenUseCase } from '../usecases/refresh-token';
import { ResetPasswordDto } from '../../otp/application/dtos/resetPassword.dto';
import { ResetPasswordUsecase } from '../usecases/reset-password.usescase';

@ApiTags('Authentification')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ Guards au niveau controller
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly authMeUseCase: AuthMeUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly resetPasswordUsecase: ResetPasswordUsecase,
  ) {}

  // ========================================
  // ROUTES PROTÉGÉES (nécessitent JWT)
  // ========================================

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil utilisateur connecté' })
  @ApiResponse({
    status: 200,
    description: 'Informations utilisateur récupérées',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async me(@Req() req: any) {
    // ✅ Vérification de sécurité
    if (!req.user || !req.user.userId) {
      this.logger.error('req.user is undefined or missing userId');
      this.logger.error('req.user:', req.user);
      throw new UnauthorizedException(
        'Token invalide ou utilisateur non trouvé',
      );
    }
    this.logger.log(`Fetching profile for user: ${req.user.userId}`);

    return await this.authMeUseCase.execute(req.user.userId);
  }
  // /**
  @Public() // ✅ Uniquement pour cette route
  @Post('register')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès, retourne un token',
    schema: {
      example: {
        user: {
          id: 'ea18f069-9da2-4756-882e-d94d638bf8ee',
          email: 'user@example.com',
          name: 'John Doe',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Utilisateur existe déjà' })
  @ApiBody({ type: UserDto })
  async register(@Body() userData: UserDto) {
    this.logger.log(`Registration attempt for: ${userData.email}`);
    return await this.registerUseCase.execute(userData);
  }
  /**
   * Connexion utilisateur
   */
  @Public() // ✅ Uniquement pour cette route
  @Post('login')
  @ApiOperation({ summary: "Connexion d'un utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie, retourne un token',
    schema: {
      example: {
        user: {
          id: 'ea18f069-9da2-4756-882e-d94d638bf8ee',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for phone: ${loginDto.email}`);
    return await this.loginUserUseCase.execute(
      loginDto.email,
      loginDto.password,
    );
  }
  @Public()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnecté un utilisateur connecté',
    description:
      'Une action permettant de deconnecté un utilisateur connecté sur son espace',
  })
  async logout(@Req() req) {
    const userId = req.user.userId; // ✅ Ne pas passer tout l’objet req.user
    return this.logoutUserUseCase.execute(userId);
  }
  @Public()
  @Patch('update/:id')
  @ApiOperation({ summary: 'Mettre à jour les informations d’un utilisateur' })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'utilisateur à mettre à jour",
  })
  @ApiBody({ type: UserDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async updateUser(@Param('id') id: string, @Body() userData: UserDto) {
    this.logger.log(`Update attempt for user ID: ${id}`);
    return await this.updateUserUseCase.execute(id, userData);
  }
  /**
   * Rafraîchir le token JWT
   */
  @Public() // ✅ Refresh token doit être public
  @Post('refresh/:id')
  @ApiOperation({
    summary: 'Rafraîchir le token JWT',
    description:
      'Permet de régénérer un access_token et un refresh_token valides à partir du refreshToken existant.',
  })
  @ApiParam({
    name: 'id',
    description: "Identifiant de l'utilisateur",
    example: 'a3f4d2b1-5678-90ab-cdef-1234567890ab',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: "Refresh token valide attribué à l'utilisateur",
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJh...etc',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens régénérés avec succès',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalide ou expiré',
  })
  async refreshToken(
    @Param('id') userId: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    this.logger.log(`Token refresh attempt for user: ${userId}`);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    return await this.refreshTokenUseCase.execute(userId, refreshToken);
  }
  // 🔒 3. Reset Password (UseCase principal)
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec OTP' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié avec succès' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.resetPasswordUsecase.execute(dto);
  }
}
