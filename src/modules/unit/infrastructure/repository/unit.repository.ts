import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';
import { UnitMapper } from '../../domain/mappers/unit.mapper.js';
import { CreateUnitDto } from '../../application/dtos/create-unit.dto.js';
import { UpdateUnitDto } from '../../application/dtos/update-unit.dto.js';
import { UnitQueryDto } from '../../application/dtos/unit-query.dto.js';
import { Unit } from '../../domain/entities/unit.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class UnitRepository implements IUnitRepository {
  private readonly logger = new Logger(UnitRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UnitMapper,
  ) {}

  async create(data: CreateUnitDto): Promise<Unit> {
    try {
      const createData = this.mapper.toPersistence(data);
      const unit = await this.prisma.unit.create({ data: createData });
      return this.mapper.toDomain(unit);
    } catch (error) {
      this.logger.error(
        'Failed to create unit',
        error instanceof Error ? error.stack : error,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A unit with this name already exists.');
        }
      }

      throw error;
    }
  }

  async findById(id: string): Promise<Unit | null> {
    try {
      const unit = await this.prisma.unit.findUnique({
        where: { id },
      });

      if (!unit) {
        return null;
      }

      return this.mapper.toDomain(unit);
    } catch (error) {
      this.logger.error(`Failed to find unit: ${id}`);
      throw new InternalServerErrorException('Error during search');
    }
  }

  async findAll(query: UnitQueryDto): Promise<PaginatedResponseRepository<Unit>> {
    try {
      const { page = 1, limit = 10, name } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.UnitWhereInput = {};
      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }

      const [units, total] = await Promise.all([
        this.prisma.unit.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.unit.count({ where }),
      ]);

      return {
        data: units.map((u) => this.mapper.toDomain(u)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate units');
      throw new BadRequestException('Error during pagination');
    }
  }

  async update(id: string, data: UpdateUnitDto): Promise<Unit> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const unit = await this.prisma.unit.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toDomain(unit);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException(`Unit ${id} does not exist`);
      }

      this.logger.error(`Failed to update unit: ${id}`);
      throw new InternalServerErrorException('Error during update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.unit.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete unit: ${id}`);
      throw new InternalServerErrorException('Error during deletion');
    }
  }
}
