import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IShopRepository } from '../../domain/interfaces/shop.interface.repository.js';
import { ShopMapper } from '../../domain/mappers/shop.mapper.js';
import { CreateShopDto } from '../../application/dtos/create-shop-dto.dto.js';
import { UpdateShopDto } from '../../application/dtos/update-shop.dto.js';
import { FilterShopDto } from '../../application/dtos/filter-shop.dto.js';
import { Shop } from '../../domain/entities/shop-entity.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class ShopRepository implements IShopRepository {
  private readonly logger = new Logger(ShopRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ShopMapper,
  ) {}

  async createShop(data: CreateShopDto): Promise<Shop> {
    try {
      const createData = this.mapper.toPersistence(data);
      const shop = await this.prisma.shop.create({ data: createData });
      return this.mapper.toApplication(shop);
    } catch (error) {
      this.logger.error(
        'Échec de la création de la boutique',
        error instanceof Error ? error.stack : error,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Une boutique avec ces informations existe déjà.',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Référence invalide dans les données fournies.',
          );
        }
      }

      throw error;
    }
  }

  async getShopById(id: string): Promise<Shop | null> {
    try {
      this.logger.debug(`Recherche de la boutique avec l'id: ${id}`);

      const shop = await this.prisma.shop.findUnique({
        where: { id },
      });

      if (!shop) {
        return null;
      }

      return this.mapper.toApplication(shop);
    } catch (error) {
      this.logger.error(`Échec de la récupération de la boutique: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getAllShops(): Promise<Shop[]> {
    try {
      const allShops = await this.prisma.shop.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return allShops.map((shop) => this.mapper.toApplication(shop));
    } catch (error) {
      this.logger.error('Échec de la récupération des boutiques');
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des boutiques',
      );
    }
  }

  async updateShop(id: string, data: UpdateShopDto): Promise<Shop> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const shop = await this.prisma.shop.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toApplication(shop);
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(`La boutique ${id} n'existe pas`);
      }

      this.logger.error(
        `Échec de la mise à jour de la boutique: ${id}`,
        (error as any)?.stack,
      );
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteShop(id: string): Promise<void> {
    try {
      await this.prisma.shop.delete({ where: { id } });
      this.logger.log(`Boutique ${id} supprimée avec succès`);
    } catch (error) {
      this.logger.error(`Échec de la suppression de la boutique: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<Shop> {
    try {
      const shop = await this.prisma.shop.update({
        where: { id },
        data: { isActive },
      });
      return this.mapper.toApplication(shop);
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(`La boutique ${id} n'existe pas`);
      }

      this.logger.error(
        `Échec du changement de statut de la boutique: ${id}`,
        (error as any)?.stack,
      );
      throw new InternalServerErrorException(
        'Erreur lors du changement de statut',
      );
    }
  }

  async paginate(
    page: number,
    limit: number,
    search?: FilterShopDto,
    isActive?: boolean,
  ): Promise<PaginatedResponseRepository<Shop>> {
    try {
      const skip = (page - 1) * limit;
      const where = this.buildWhereClause(search, isActive);

      const [shops, total] = await Promise.all([
        this.prisma.shop.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.shop.count({ where }),
      ]);

      return {
        data: shops.map((shop) => this.mapper.toApplication(shop)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Échec de la pagination des boutiques');
      throw new BadRequestException('Erreur lors de la pagination');
    }
  }

  /**
   * Construit la clause WHERE pour Prisma en fonction des filtres
   */
  private buildWhereClause(
    search?: FilterShopDto,
    isActive?: boolean,
  ): Prisma.ShopWhereInput {
    const where: Prisma.ShopWhereInput = {};
    const orFilters: Prisma.ShopWhereInput[] = [];

    if (search) {
      if (search.name?.trim()) {
        orFilters.push({
          name: { contains: search.name.trim(), ...caseInsensitive() },
        });
      }
      if (search.address?.trim()) {
        orFilters.push({
          address: { contains: search.address.trim(), ...caseInsensitive() },
        });
      }
      if (search.phone?.trim()) {
        orFilters.push({
          phone: { contains: search.phone.trim(), ...caseInsensitive() },
        });
      }
      if (search.email?.trim()) {
        orFilters.push({
          email: { contains: search.email.trim(), ...caseInsensitive() },
        });
      }
    }

    if (orFilters.length > 0) {
      where.OR = orFilters;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return where;
  }
}
