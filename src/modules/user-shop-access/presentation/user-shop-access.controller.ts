import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserShopAccessService } from '../application/services/user-shop-access.service';
import { AssignUserDto } from '../application/dtos/assign-user.dto';

@ApiTags('Gestion des Accès Boutiques')
@ApiBearerAuth('access-token')
@Controller()
export class UserShopAccessController {
  private readonly logger = new Logger(UserShopAccessController.name);

  constructor(private readonly service: UserShopAccessService) {}

  // ============================================
  // ASSIGNER UN UTILISATEUR À UNE BOUTIQUE
  // ============================================
  @Post('shops/:shopId/users/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assigner un utilisateur à une boutique',
    description:
      "Permet d'attribuer un rôle à un utilisateur pour accéder à une boutique spécifique.",
  })
  @ApiParam({
    name: 'shopId',
    type: String,
    description: 'Identifiant unique de la boutique (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: "Identifiant unique de l'utilisateur (UUID)",
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiBody({
    type: AssignUserDto,
    description: "Rôle à attribuer à l'utilisateur dans la boutique",
    examples: {
      example1: {
        summary: 'Assigner comme Manager',
        value: {
          roleInShop: 'MANAGER',
        },
      },
      example2: {
        summary: 'Assigner comme Caissier',
        value: {
          roleInShop: 'CASHIER',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur assigné avec succès à la boutique',
    schema: {
      example: {
        id: 'access-123',
        userId: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
        shopId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        roleInShop: 'MANAGER',
        createdAt: '2026-05-16T10:30:00Z',
        updatedAt: '2026-05-16T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      example: {
        statusCode: 400,
        message: ['Le rôle doit être valide'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Boutique ou utilisateur non trouvé',
    schema: {
      example: {
        statusCode: 404,
        message: 'Boutique introuvable',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Utilisateur déjà assigné à cette boutique',
    schema: {
      example: {
        statusCode: 409,
        message: 'Cet utilisateur est déjà assigné à cette boutique',
        error: 'Conflict',
      },
    },
  })
  async assign(
    @Param('shopId') shopId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignUserDto,
  ) {
    this.logger.log(
      `Assigning user ${userId} to shop ${shopId} with role ${dto.roleInShop}`,
    );
    return this.service.assignUserToShop(userId, shopId, dto.roleInShop);
  }

  // ============================================
  // MODIFIER LE RÔLE D'UN UTILISATEUR
  // ============================================
  @Patch('shops/:shopId/users/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Modifier le rôle d'un utilisateur dans une boutique",
    description:
      "Permet de mettre à jour le rôle d'un utilisateur déjà assigné à une boutique.",
  })
  @ApiParam({
    name: 'shopId',
    type: String,
    description: 'Identifiant unique de la boutique (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: "Identifiant unique de l'utilisateur (UUID)",
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiBody({
    type: AssignUserDto,
    description: 'Nouveau rôle à attribuer',
    examples: {
      example1: {
        summary: 'Promouvoir en Manager',
        value: {
          roleInShop: 'MANAGER',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour avec succès',
    schema: {
      example: {
        id: 'access-123',
        userId: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
        shopId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        roleInShop: 'ADMIN',
        updatedAt: '2026-05-16T11:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Assignation non trouvée',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Aucune assignation trouvée pour cet utilisateur dans cette boutique',
        error: 'Not Found',
      },
    },
  })
  async update(
    @Param('shopId') shopId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignUserDto,
  ) {
    this.logger.log(
      `Updating role for user ${userId} in shop ${shopId} to ${dto.roleInShop}`,
    );
    return this.service.updateUserRole(userId, shopId, dto.roleInShop);
  }

  // ============================================
  // RETIRER UN UTILISATEUR D'UNE BOUTIQUE
  // ============================================
  @Delete('shops/:shopId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Retirer un utilisateur d'une boutique",
    description: "Supprime l'accès d'un utilisateur à une boutique spécifique.",
  })
  @ApiParam({
    name: 'shopId',
    type: String,
    description: 'Identifiant unique de la boutique (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: "Identifiant unique de l'utilisateur (UUID)",
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiResponse({
    status: 204,
    description: 'Utilisateur retiré avec succès (aucun contenu retourné)',
  })
  @ApiResponse({
    status: 404,
    description: 'Assignation non trouvée',
    schema: {
      example: {
        statusCode: 404,
        message: 'Aucune assignation trouvée',
        error: 'Not Found',
      },
    },
  })
  async remove(
    @Param('shopId') shopId: string,
    @Param('userId') userId: string,
  ) {
    this.logger.log(`Removing user ${userId} from shop ${shopId}`);
    return this.service.removeUserFromShop(userId, shopId);
  }

  // ============================================
  // LISTER LES UTILISATEURS D'UNE BOUTIQUE
  // ============================================
  @Get('shops/:shopId/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les utilisateurs assignés à une boutique',
    description:
      'Retourne tous les utilisateurs ayant accès à une boutique avec leurs rôles respectifs.',
  })
  @ApiParam({
    name: 'shopId',
    type: String,
    description: 'Identifiant unique de la boutique (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs retournée avec succès',
    schema: {
      example: [
        {
          id: 'access-123',
          userId: 'user-abc',
          roleInShop: 'MANAGER',
          user: {
            id: 'user-abc',
            name: 'Jean Dupont',
            email: 'jean.dupont@example.com',
          },
          createdAt: '2026-05-10T10:00:00Z',
        },
        {
          id: 'access-456',
          userId: 'user-def',
          roleInShop: 'CASHIER',
          user: {
            id: 'user-def',
            name: 'Marie Martin',
            email: 'marie.martin@example.com',
          },
          createdAt: '2026-05-12T14:30:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Boutique non trouvée',
  })
  async listByShop(@Param('shopId') shopId: string) {
    this.logger.log(`Listing users for shop ${shopId}`);
    return this.service.listUsersForShop(shopId);
  }

  // ============================================
  // LISTER LES BOUTIQUES D'UN UTILISATEUR
  // ============================================
  @Get('users/:userId/shops')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les boutiques accessibles par un utilisateur',
    description:
      'Retourne toutes les boutiques auxquelles un utilisateur a accès avec ses rôles.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: "Identifiant unique de l'utilisateur (UUID)",
    example: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des boutiques retournée avec succès',
    schema: {
      example: [
        {
          id: 'access-123',
          shopId: 'shop-abc',
          roleInShop: 'MANAGER',
          shop: {
            id: 'shop-abc',
            name: 'Boutique Centre-Ville',
            address: '123 Rue de la Paix, Abidjan',
            isActive: true,
          },
          createdAt: '2026-05-10T10:00:00Z',
        },
        {
          id: 'access-789',
          shopId: 'shop-xyz',
          roleInShop: 'ADMIN',
          shop: {
            id: 'shop-xyz',
            name: 'Boutique Plateau',
            address: '456 Avenue de la République, Abidjan',
            isActive: true,
          },
          createdAt: '2026-05-15T09:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async listByUser(@Param('userId') userId: string) {
    this.logger.log(`Listing shops for user ${userId}`);
    return this.service.listShopsForUser(userId);
  }
}
