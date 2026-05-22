import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ICustomerRepository } from '../../domain/interfaces/customer.interface.repository.js';
import { CustomerMapper } from '../../domain/mappers/customer.mapper.js';
import { CreateCustomerDto } from '../../application/dtos/create-customer.dto.js';
import { UpdateCustomerDto } from '../../application/dtos/update-customer.dto.js';
import { FilterCustomerDto } from '../../application/dtos/filter-customer.dto.js';
import { Customer } from '../../domain/entities/customer-entity.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class CustomerRepository implements ICustomerRepository {
  private readonly logger = new Logger(CustomerRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CustomerMapper,
  ) {}

  async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    try {
      const createData = this.mapper.toPersistence(data);
      const customer = await this.prisma.customer.create({ data: createData });
      return this.mapper.toApplication(customer);
    } catch (error) {
      this.logger.error(
        'Échec de la création du client',
        error instanceof Error ? error.stack : error,
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Un client avec ces informations existe déjà.',
          );
        }
      }

      throw error;
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return null;
      }

      return this.mapper.toApplication(customer);
    } catch (error) {
      this.logger.error(`Échec de la récupération du client: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      const allCustomers = await this.prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return allCustomers.map((customer) => this.mapper.toApplication(customer));
    } catch (error) {
      this.logger.error('Échec de la récupération des clients');
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des clients',
      );
    }
  }

  async updateCustomer(id: string, data: UpdateCustomerDto): Promise<Customer> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toApplication(customer);
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new BadRequestException(`Le client ${id} n'existe pas`);
      }

      this.logger.error(
        `Échec de la mise à jour du client: ${id}`,
        (error as any)?.stack,
      );
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await this.prisma.customer.delete({ where: { id } });
      this.logger.log(`Client ${id} supprimé avec succès`);
    } catch (error) {
      this.logger.error(`Échec de la suppression du client: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }

  async paginate(
    page: number,
    limit: number,
    search?: FilterCustomerDto,
  ): Promise<PaginatedResponseRepository<Customer>> {
    try {
      const skip = (page - 1) * limit;
      const where = this.buildWhereClause(search);

      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return {
        data: customers.map((customer) => this.mapper.toApplication(customer)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Échec de la pagination des clients');
      throw new BadRequestException('Erreur lors de la pagination');
    }
  }

  private buildWhereClause(search?: FilterCustomerDto): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {};
    const orFilters: Prisma.CustomerWhereInput[] = [];

    if (search) {
      if (search.name?.trim()) {
        orFilters.push({
          name: { contains: search.name.trim(), ...caseInsensitive() },
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

    return where;
  }
}
