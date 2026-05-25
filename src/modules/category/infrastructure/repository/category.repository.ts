import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ICategoryRepository } from '../../domain/interfaces/category-repository.interface.js';
import { CategoryMapper } from '../../domain/mappers/category.mapper.js';
import { CreateCategoryDto } from '../../application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '../../application/dtos/update-category.dto.js';
import { CategoryQueryDto } from '../../application/dtos/category-query.dto.js';
import { Category } from '../../domain/entities/category.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class CategoryRepository implements ICategoryRepository {
  private readonly logger = new Logger(CategoryRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CategoryMapper,
  ) {}

  async create(data: CreateCategoryDto): Promise<Category> {
    try {
      const createData = this.mapper.toPersistence(data);
      const category = await this.prisma.category.create({ data: createData });
      return this.mapper.toDomain(category);
    } catch (error) {
      this.logger.error(
        'Failed to create category',
        error instanceof Error ? error.stack : error,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A category with this information already exists.');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid reference in provided data.');
        }
      }

      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return null;
      }

      return this.mapper.toDomain(category);
    } catch (error) {
      this.logger.error(`Failed to find category: ${id}`);
      throw new InternalServerErrorException('Error during search');
    }
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedResponseRepository<Category>> {
    try {
      const { page = 1, limit = 50, name } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.CategoryWhereInput = {};
      if (name) {
        where.name = { contains: name, ...caseInsensitive() };
      }

      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.category.count({ where }),
      ]);

      return {
        data: categories.map((cat) => this.mapper.toDomain(cat)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate categories');
      throw new BadRequestException('Error during pagination');
    }
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toDomain(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException(`Category ${id} does not exist`);
      }

      this.logger.error(`Failed to update category: ${id}`);
      throw new InternalServerErrorException('Error during update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete category: ${id}`);
      throw new InternalServerErrorException('Error during deletion');
    }
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
      });
      return categories.map((cat) => this.mapper.toDomain(cat));
    } catch (error) {
      this.logger.error(`Failed to find subcategories for: ${parentId}`);
      throw new InternalServerErrorException('Error during subcategories search');
    }
  }

  async findRoots(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
      });
      return categories.map((cat) => this.mapper.toDomain(cat));
    } catch (error) {
      this.logger.error('Failed to find root categories');
      throw new InternalServerErrorException('Error during root categories search');
    }
  }
}
