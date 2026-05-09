import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  Logger,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';
import { FindAllUserUseCase } from '../../application/usecases/findAlluser.user.use-case';
import { DeleteUserUseCase } from '../../application/usecases/delete.user.use-case';
import { FindUserByIdUseCase } from '../../application/usecases/find_user_by_id.use_case';
import { PaginateUserUseCase } from '../../application/usecases/paginate-user.usecase';
import { PaginateUserQueryDto } from '../../application/dtos/paginateUserQuery.dto';
import { UserRole } from '../../domain/enums/role.enum';
import { FindUserByPhoneUsecase } from '../../application/usecases/finduserByphone.usecase';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/role.guard';
import { Public } from '../../../../../common/decorators/public.decorator';
import { ControllerStatasUseCase } from '../../application/usecases/controller-stats.usecase';
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(
    private readonly findAllUserUseCase: FindAllUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly paginateUserUseCase: PaginateUserUseCase,
    private readonly findUserByPhoneUsecase: FindUserByPhoneUsecase,
    private readonly controllerStatasUseCase: ControllerStatasUseCase,
  ) {}
  @Public()
  @Get('phone')
  @ApiOperation({ summary: 'Rechercher un utilisateur par téléphone' })
  @ApiQuery({
    name: 'phone',
    required: true,
    type: String,
    description: "Numéro de téléphone de l'utilisateur",
    example: '+225 07 12 34 56 78',
  })
  @ApiOkResponse({
    description: 'Utilisateur trouvé avec succès',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findByPhone(@Query('phone') phone: string): Promise<User | null> {
    this.logger.log(`Searching user by phone: ${phone}`);
    return await this.findUserByPhoneUsecase.execute(phone);
  }
  @Public()
  @Get('paginate')
  @ApiOperation({ summary: 'Paginer les utilisateurs avec des filtres' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des utilisateurs',
    schema: {
      example: {
        data: [
          {
            id: 'ea18f069-9da2-4756-882e-d94d638bf8ee',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'MANAGER',
          },
        ],
        total: 12,
        totalPage: 6,
        page: 1,
        limit: 2,
      },
    },
  })
  @Public()
  async paginate(@Query() query: PaginateUserQueryDto) {
    const { page = '1', limit = '10', role, ...search } = query;

    this.logger.log(
      `Paginating users - Page: ${page}, Limit: ${limit}, Role: ${role}`,
    );

    return await this.paginateUserUseCase.execute(
      Number(page),
      Number(limit),
      search,
      role,
    );
  }
  @Public()
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  @ApiOkResponse({
    description: 'Liste des utilisateurs récupérée avec succès',
    type: [User],
  })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  async getAllUsers(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return await this.findAllUserUseCase.execute();
  }
@Public()
  @Get("/controller/stats")
  @ApiOperation({
    summary: 'Récupérer les statistiques de performance d\'une cassière',
    description:
      'Retourne une liste paginée des contrôleurs avec le nombre total de tickets scannés par chacun.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: "Nombre d'éléments par page",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Numéro de la page',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès.',
    // Ici tu peux ajouter un schema type si tu as un DTO de réponse
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès refusé - Rôle insuffisant.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erreur serveur.',
  })
  async getStats(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
  ) {
    return await this.controllerStatasUseCase.execute(limit, page);
  }
  /**
   * Récupérer un utilisateur par ID
   * Route: GET /users/:id
   */
  @Public() // Ajoutez ceci si la route doit être publique
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({
    name: 'id',
    description: "UUID de l'utilisateur",
    example: 'ea18f069-9da2-4756-882e-d94d638bf8ee',
  })
  @ApiOkResponse({
    description: 'Utilisateur récupéré avec succès',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserById(@Param('id') userId: string): Promise<User> {
    this.logger.log(`Fetching user by ID: ${userId}`);

    const user = await this.findUserByIdUseCase.execute(userId);

    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
    return user;
  }
  /**
   * Supprimer un utilisateur
   * Route: DELETE /users/:id
   */
  @Public() // ✅ Ajoutez ceci si la route doit être publique
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({
    name: 'id',
    description: "UUID de l'utilisateur à supprimer",
    example: 'ea18f069-9da2-4756-882e-d94d638bf8ee',
  })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deleteUser(
    @Param('id') userId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting user with ID: ${userId}`);

    try {
      await this.deleteUserUseCase.execute(userId);
      return {
        success: true,
        message: 'Utilisateur supprimé avec succès',
      };
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}`);
      throw new NotFoundException(`Utilisateur avec ID ${userId} non trouvé`);
    }
  }
}
