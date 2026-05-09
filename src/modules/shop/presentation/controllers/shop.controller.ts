import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { CreateShopDto } from '../../application/dtos/create-shop-dto.dto.js';
import { UpdateShopDto } from '../../application/dtos/update-shop.dto.js';
import { PaginateShopQueryDto } from '../../application/dtos/paginate-shop-query.dto.js';
import { CreateShopUseCase } from '../../application/usecases/create-shop.usecase.js';
import { FindAllShopsUseCase } from '../../application/usecases/find-all-shops.usecase.js';
import { FindShopByIdUseCase } from '../../application/usecases/find-shop-by-id.usecase.js';
import { UpdateShopUseCase } from '../../application/usecases/update-shop.usecase.js';
import { DeleteShopUseCase } from '../../application/usecases/delete-shop.usecase.js';
import { PaginateShopUseCase } from '../../application/usecases/paginate-shop.usecase.js';
import { ToggleShopActiveUseCase } from '../../application/usecases/toggle-shop-active.usecase.js';
import { Public } from '../../../../common/decorators/public.decorator.js';

@ApiTags('shops')
@ApiBearerAuth()
@Controller('shops')
export class ShopController {
  private readonly logger = new Logger(ShopController.name);

  constructor(
    private readonly createShopUseCase: CreateShopUseCase,
    private readonly findAllShopsUseCase: FindAllShopsUseCase,
    private readonly findShopByIdUseCase: FindShopByIdUseCase,
    private readonly updateShopUseCase: UpdateShopUseCase,
    private readonly deleteShopUseCase: DeleteShopUseCase,
    private readonly paginateShopUseCase: PaginateShopUseCase,
    private readonly toggleShopActiveUseCase: ToggleShopActiveUseCase,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle boutique',
    description: 'Crée une nouvelle boutique avec les informations fournies.',
  })
  @ApiBody({ type: CreateShopDto })
  @ApiCreatedResponse({
    description: 'Boutique créée avec succès',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Ma Boutique',
        address: 'Rue 10, Cocody, Abidjan',
        phone: '+225 07 12 34 56 78',
        email: 'boutique@example.com',
        taxId: 'CI-ABJ-2026-001',
        logoUrl: 'https://example.com/logo.png',
        currency: 'XOF',
        isActive: true,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-09T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Boutique déjà existante' })
  async createShop(@Body() createShopDto: CreateShopDto): Promise<Shop> {
    this.logger.log(`Création d'une nouvelle boutique: ${createShopDto.name}`);
    return await this.createShopUseCase.execute(createShopDto);
  }

  // ─── PAGINATE ─────────────────────────────────────────────────────
  @Public()
  @Get('paginate')
  @ApiOperation({
    summary: 'Paginer les boutiques avec des filtres',
    description:
      'Retourne une liste paginée des boutiques avec possibilité de filtrer par nom, adresse, téléphone, email et statut.',
  })
  @ApiQuery({ name: 'page', required: false, type: String, example: '1', description: 'Numéro de la page' })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '10', description: "Nombre d'éléments par page" })
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filtrer par nom' })
  @ApiQuery({ name: 'address', required: false, type: String, description: 'Filtrer par adresse' })
  @ApiQuery({ name: 'phone', required: false, type: String, description: 'Filtrer par téléphone' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filtrer par email' })
  @ApiQuery({ name: 'isActive', required: false, type: String, description: 'Filtrer par statut actif (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des boutiques',
    schema: {
      example: {
        data: [
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Ma Boutique',
            address: 'Rue 10, Cocody, Abidjan',
            phone: '+225 07 12 34 56 78',
            email: 'boutique@example.com',
            currency: 'XOF',
            isActive: true,
          },
        ],
        total: 12,
        totalPages: 6,
        page: 1,
        limit: 2,
      },
    },
  })
  async paginate(@Query() query: PaginateShopQueryDto) {
    const { page = '1', limit = '10', isActive, ...search } = query;

    this.logger.log(
      `Pagination des boutiques - Page: ${page}, Limit: ${limit}, IsActive: ${isActive}`,
    );

    const isActiveBool =
      isActive !== undefined ? isActive === 'true' : undefined;

    return await this.paginateShopUseCase.execute(
      Number(page),
      Number(limit),
      search,
      isActiveBool,
    );
  }

  // ─── GET ALL ──────────────────────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les boutiques',
    description: 'Retourne la liste complète de toutes les boutiques.',
  })
  @ApiOkResponse({
    description: 'Liste des boutiques récupérée avec succès',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Ma Boutique',
          address: 'Rue 10, Cocody, Abidjan',
          phone: '+225 07 12 34 56 78',
          email: 'boutique@example.com',
          taxId: 'CI-ABJ-2026-001',
          logoUrl: 'https://example.com/logo.png',
          currency: 'XOF',
          isActive: true,
          createdAt: '2026-05-09T00:00:00.000Z',
          updatedAt: '2026-05-09T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
  async getAllShops(): Promise<Shop[]> {
    this.logger.log('Récupération de toutes les boutiques');
    return await this.findAllShopsUseCase.execute();
  }

  // ─── GET BY ID ────────────────────────────────────────────────────
  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une boutique par ID',
    description: 'Retourne les détails complets d\'une boutique spécifique.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la boutique',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    description: 'Boutique récupérée avec succès',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Ma Boutique',
        address: 'Rue 10, Cocody, Abidjan',
        phone: '+225 07 12 34 56 78',
        email: 'boutique@example.com',
        taxId: 'CI-ABJ-2026-001',
        logoUrl: 'https://example.com/logo.png',
        currency: 'XOF',
        isActive: true,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-09T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Boutique non trouvée' })
  async getShopById(@Param('id') shopId: string): Promise<Shop> {
    this.logger.log(`Récupération de la boutique: ${shopId}`);

    const shop = await this.findShopByIdUseCase.execute(shopId);

    if (!shop) {
      throw new NotFoundException(`Boutique avec ID ${shopId} non trouvée`);
    }
    return shop;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────
  @Public()
  @Put(':id')
  @ApiOperation({
    summary: 'Mettre à jour une boutique',
    description: 'Met à jour les informations d\'une boutique existante.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la boutique à mettre à jour',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateShopDto })
  @ApiOkResponse({
    description: 'Boutique mise à jour avec succès',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Ma Boutique Renommée',
        address: 'Rue 15, Plateau, Abidjan',
        phone: '+225 01 23 45 67 89',
        email: 'contact@maboutique.com',
        taxId: 'CI-ABJ-2026-002',
        logoUrl: 'https://example.com/new-logo.png',
        currency: 'XOF',
        isActive: true,
        createdAt: '2026-05-09T00:00:00.000Z',
        updatedAt: '2026-05-09T01:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Boutique non trouvée' })
  async updateShop(
    @Param('id') shopId: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<Shop> {
    this.logger.log(`Mise à jour de la boutique: ${shopId}`);
    return await this.updateShopUseCase.execute(shopId, updateShopDto);
  }

  // ─── TOGGLE ACTIVE ────────────────────────────────────────────────
  @Public()
  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Activer ou désactiver une boutique',
    description: 'Change le statut actif/inactif d\'une boutique.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la boutique',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: false,
          description: 'Nouveau statut actif de la boutique',
        },
      },
      required: ['isActive'],
    },
  })
  @ApiOkResponse({
    description: 'Statut de la boutique modifié avec succès',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Ma Boutique',
        isActive: false,
        updatedAt: '2026-05-09T01:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Boutique non trouvée' })
  async toggleActive(
    @Param('id') shopId: string,
    @Body('isActive') isActive: boolean,
  ): Promise<Shop> {
    this.logger.log(
      `Changement de statut de la boutique ${shopId} -> isActive: ${isActive}`,
    );
    return await this.toggleShopActiveUseCase.execute(shopId, isActive);
  }

  // ─── DELETE ───────────────────────────────────────────────────────
  @Public()
  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une boutique',
    description:
      'Supprime définitivement une boutique. Cette action est irréversible.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la boutique à supprimer',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Boutique supprimée avec succès',
    schema: {
      example: {
        success: true,
        message: 'Boutique supprimée avec succès',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Boutique non trouvée' })
  async deleteShop(
    @Param('id') shopId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Suppression de la boutique: ${shopId}`);

    try {
      await this.deleteShopUseCase.execute(shopId);
      return {
        success: true,
        message: 'Boutique supprimée avec succès',
      };
    } catch (error) {
      this.logger.error(`Échec de la suppression de la boutique ${shopId}`);
      throw new NotFoundException(`Boutique avec ID ${shopId} non trouvée`);
    }
  }
}
