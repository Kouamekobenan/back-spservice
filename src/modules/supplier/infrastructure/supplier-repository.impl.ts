import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ISupplierRepository } from '../domain/interfaces/supplier-repository.interface.js';
import { SupplierMapper } from '../domain/mappers/supplier.mapper.js';
import { CreateSupplierDto } from '../application/dtos/create-supplier-dto.dto.js';
import { UpdateSupplierDto } from '../application/dtos/update-supplier-dto.dto.js';
import { SupplierQueryDto } from '../application/dtos/supplier-query.dto.js';
import { Supplier } from '../domain/entities/supplier-entity.entity.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../common/types/response-respository.js';

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class SupplierRepository implements ISupplierRepository {
  private readonly logger = new Logger(SupplierRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: SupplierMapper,
  ) {}

  async create(data: CreateSupplierDto): Promise<Supplier> {
    try {
      const createData = this.mapper.toPersistence(data);
      const supplier = await this.prisma.supplier.create({ data: createData });
      return this.mapper.toDomain(supplier);
    } catch (error) {
      this.logger.error(
        'Failed to create supplier',
        error instanceof Error ? error.stack : error,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('A supplier with this information already exists.');
        }
      }

      throw error;
    }
  }

  async findById(id: string): Promise<Supplier | null> {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return null;
      }

      return this.mapper.toDomain(supplier);
    } catch (error) {
      this.logger.error(`Failed to find supplier: ${id}`);
      throw new InternalServerErrorException('Error during search');
    }
  }

  async findAll(query: SupplierQueryDto): Promise<PaginatedResponseRepository<Supplier>> {
    try {
      const { page = 1, limit = 10, name, email, phone } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.SupplierWhereInput = {};
      if (name) {
        where.name = { contains: name, ...caseInsensitive() };
      }
      if (email) {
        where.email = { contains: email, ...caseInsensitive() };
      }
      if (phone) {
        where.phone = { contains: phone, ...caseInsensitive() };
      }

      const [suppliers, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.supplier.count({ where }),
      ]);

      return {
        data: suppliers.map((s) => this.mapper.toDomain(s)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate suppliers');
      throw new BadRequestException('Error during pagination');
    }
  }

  async update(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const supplier = await this.prisma.supplier.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toDomain(supplier);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException(`Supplier ${id} does not exist`);
      }

      this.logger.error(`Failed to update supplier: ${id}`);
      throw new InternalServerErrorException('Error during update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.supplier.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete supplier: ${id}`);
      throw new InternalServerErrorException('Error during deletion');
    }
  }
}
