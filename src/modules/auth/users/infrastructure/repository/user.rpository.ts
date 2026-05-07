import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IUserRepository } from '../../application/interfaces/user.interface.repository';
import { UserMapper } from '../../domain/mappers/user.mapper';
import { UserDto } from '../../application/dtos/user.dto';
import { User } from '../../domain/entities/user.entity';
import { FilterUserDto } from '../../application/dtos/filter-user.dto';
import { UserRole } from '../../domain/enums/role.enum';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PaginatedResponseRepository } from '../../../../../common/types/response-respository';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {}

  async createUser(dataUser: UserDto): Promise<User> {
    try {
      const createData = this.mapper.toPersitence(dataUser);
      const user = await this.prisma.user.create({ data: createData });
      return this.mapper.toAplication(user);
    } catch (error) {
      // ✅ Log l'erreur complète pour voir la vraie cause (Prisma, contrainte, etc.)
      this.logger.error(
        'Failed to create user',
        error instanceof Error ? error.stack : error,
      );

      // ✅ Gérer les erreurs Prisma connues au lieu de tout écraser
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 = violation de contrainte unique (email déjà pris, etc.)
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Un utilisateur avec cet email existe déjà.',
          );
        }
        // P2003 = violation de clé étrangère
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Référence invalide dans les données fournies.',
          );
        }
      }

      // Erreur inconnue : on relance l'originale pour ne pas perdre le stack trace
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        return null; // ✅ Le service décide de l'erreur à lancer
      }

      return this.mapper.toAplication(user);
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { phone },
      });

      if (!user) {
        return null;
      }

      return this.mapper.toAplication(user);
    } catch (error) {
      this.logger.error(`Failed to find user by phone: ${phone}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      this.logger.debug(`Searching user with id: ${id}`);

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return null;
      }

      return this.mapper.toAplication(user);
    } catch (error) {
      this.logger.error(`Failed to get user by id: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return allUsers.map((user) => this.mapper.toAplication(user));
    } catch (error) {
      this.logger.error('Failed to get all users');
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des utilisateurs',
      );
    }
  }
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken },
      });

      return this.mapper.toAplication(user);
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(`L'utilisateur ${userId} n'existe pas`);
      }

      this.logger.error(
        `Failed to update refresh token for user: ${userId}`,
        (error as any)?.stack,
      );
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id: userId } });
      this.logger.log(`User ${userId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${userId}`);
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }

  async paginate(
    page: number,
    limit: number,
    search?: FilterUserDto,
    role?: UserRole | 'ALL',
  ): Promise<{
    data: User[];
    totalPage: number;
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const where = this.buildWhereClause(search, role);
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users.map((user) => this.mapper.toAplication(user)),
        total,
        totalPage: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate users');
      throw new BadRequestException('Erreur lors de la pagination');
    }
  }

  /**
   * Construit la clause WHERE pour Prisma en fonction des filtres
   */
  private buildWhereClause(
    search?: FilterUserDto,
    role?: UserRole | 'ALL',
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    const orFilters: Prisma.UserWhereInput[] = [];

    if (search) {
      if (search.name?.trim()) {
        orFilters.push({
          name: { contains: search.name.trim(), mode: 'insensitive' },
        });
      }
      if (search.email?.trim()) {
        orFilters.push({
          email: { contains: search.email.trim(), mode: 'insensitive' },
        });
      }
      if (search.phone?.trim()) {
        orFilters.push({
          phone: { contains: search.phone.trim(), mode: 'insensitive' },
        });
      }
    }

    if (orFilters.length > 0) {
      where.OR = orFilters;
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    return where;
  }

  async updateUser(id: string, dataUser: UserDto): Promise<User> {
    const updateData = this.mapper.toUpdateUser(dataUser);
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.mapper.toAplication(user);
  }
  async updatePassword(id: string, password: string): Promise<User> {
    const newPass = await this.prisma.user.update({
      where: { id },
      data: { password },
    });
    return this.mapper.toAplication(newPass);
  }
  // STATISTIQUE 
  async stats(
    limit: number,
    page: number,
  ): Promise<PaginatedResponseRepository<User>> {
    const skip = (page - 1) * limit;
    const [controllers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'CONTROLLER' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          // _count: {
          //   select: { scannedTickets: true },
          // },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where: { role: 'CONTROLLER' } }),
    ]);
    const mappedData = controllers.map((s) => this.mapper.toAplication(s));
    return {
      data: mappedData,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }
}
