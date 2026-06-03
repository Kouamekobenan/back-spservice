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

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserMapper,
  ) {}

  async createUser(dataUser: UserDto): Promise<User> {
    try {
      const createData = this.mapper.toPersistence(dataUser);
      const user = await this.prisma.user.create({
        data: createData,
        include: {
          shopAccesses: {
            select: { shop: true, shopId: true, roleInShop: true },
          },
        },
      });
      return this.mapper.toApplication(user);
    } catch (error) {
      this.logger.error(
        'Failed to create user',
        error instanceof Error ? error.stack : error,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ConflictException(
            'Un utilisateur avec cet identifiant existe déjà.',
          );
      }
      throw error;
    }
  }
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { phone },
        include: {
          shopAccesses: {
            select: { shop: true, shopId: true, roleInShop: true },
          },
        },
      });
      return user ? this.mapper.toApplication(user) : null;
    } catch (error) {
      this.logger.error(`Failed to find user by phone: ${phone}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
        include: {
          shopAccesses: {
            select: { shop: true, shopId: true, roleInShop: true },
          },
        },
      });
      return user ? this.mapper.toApplication(user) : null;
    } catch (error) {
      this.logger.error(`Failed to find user by username: ${username}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          shopAccesses: {
            select: { shop: true, shopId: true, roleInShop: true },
          },
        },
      });
      return user ? this.mapper.toApplication(user) : null;
    } catch (error) {
      this.logger.error(`Failed to get user by id: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await this.prisma.user.findMany({
        include: {
          shopAccesses: {
            select: { shop: true, shopId: true, roleInShop: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return allUsers.map((user) => this.mapper.toApplication(user));
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
        include: { shopAccesses: true },
      });
      return this.mapper.toApplication(user);
    } catch (error) {
      this.logger.error(`Failed to update refresh token for user: ${userId}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id: userId } });
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
          include: { shopAccesses: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);
      return {
        data: users.map((user) => this.mapper.toApplication(user)),
        total,
        totalPage: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException('Erreur lors de la pagination');
    }
  }

  private buildWhereClause(
    search?: FilterUserDto,
    role?: UserRole | 'ALL',
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    const orFilters: Prisma.UserWhereInput[] = [];
    if (search) {
      if (search.name?.trim())
        orFilters.push({
          name: { contains: search.name.trim(), ...caseInsensitive() },
        });
      if (search.phone?.trim())
        orFilters.push({
          phone: { contains: search.phone.trim(), ...caseInsensitive() },
        });
    }
    if (orFilters.length > 0) where.OR = orFilters;
    if (role && role !== 'ALL') where.role = role as UserRole;
    return where;
  }

  async updateUser(id: string, dataUser: UserDto): Promise<User> {
    const updateData = this.mapper.toUpdateUser(dataUser);
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { shopAccesses: true },
    });
    return this.mapper.toApplication(user);
  }

  async updatePassword(id: string, password: string): Promise<User> {
    const newPass = await this.prisma.user.update({
      where: { id },
      data: { passwordHash: password },
      include: { shopAccesses: true },
    });
    return this.mapper.toApplication(newPass);
  }

  async stats(
    limit: number,
    page: number,
  ): Promise<PaginatedResponseRepository<User>> {
    const skip = (page - 1) * limit;
    const [controllers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'CASHIER' },
        include: { shopAccesses: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { role: 'CASHIER' } }),
    ]);
    return {
      data: controllers.map((s) => this.mapper.toApplication(s)),
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }
  async lastConnect(id: string): Promise<User> {
    const connect = await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
    return this.mapper.toApplication(connect);
  }
}
