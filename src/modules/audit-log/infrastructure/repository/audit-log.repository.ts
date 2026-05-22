import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { IAuditLogRepository } from '../../domain/interfaces/audit-log.interface.repository.js';
import { AuditLogMapper } from '../../domain/mappers/audit-log.mapper.js';
import { CreateAuditLogDto } from '../../application/dto/create-audit-log.dto.js';
import { FilterAuditLogDto } from '../../application/dto/filter-audit-log.dto.js';
import { AuditLog } from '../../domain/entities/audit-log.entity.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';
import { Prisma } from '@prisma/client';

const caseInsensitive = () =>
  process.env.DATABASE_PROVIDER === 'sqlite'
    ? {}
    : { mode: 'insensitive' as const };


@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  private readonly logger = new Logger(AuditLogRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: AuditLogMapper,
  ) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const createData = this.mapper.toPersistence(data);
      const auditLog = await this.prisma.auditLog.create({
        data: createData,
      });
      return this.mapper.toApplication(auditLog);
    } catch (error) {
      this.logger.error('Failed to create audit log', error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Error creating audit log');
    }
  }

  async findById(id: string): Promise<AuditLog | null> {
    try {
      const auditLog = await this.prisma.auditLog.findUnique({
        where: { id },
      });
      return auditLog ? this.mapper.toApplication(auditLog) : null;
    } catch (error) {
      this.logger.error(`Failed to find audit log ${id}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Error finding audit log');
    }
  }

  async findAll(filter?: FilterAuditLogDto): Promise<AuditLog[]> {
    try {
      const where = this.buildWhereClause(filter);
      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return auditLogs.map((log) => this.mapper.toApplication(log));
    } catch (error) {
      this.logger.error('Failed to fetch audit logs', error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Error fetching audit logs');
    }
  }

  async paginate(
    page: number,
    limit: number,
    filter?: FilterAuditLogDto,
  ): Promise<PaginatedResponseRepository<AuditLog>> {
    try {
      const skip = (page - 1) * limit;
      const where = this.buildWhereClause(filter);

      const [auditLogs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return {
        data: auditLogs.map((log) => this.mapper.toApplication(log)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate audit logs', error instanceof Error ? error.stack : error);
      throw new BadRequestException('Error paginating audit logs');
    }
  }

  private buildWhereClause(filter?: FilterAuditLogDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (filter) {
      if (filter.action) where.action = filter.action;
      if (filter.entityType) where.entityType = { contains: filter.entityType, ...caseInsensitive() };
      if (filter.entityId) where.entityId = filter.entityId;
      if (filter.userId) where.userId = filter.userId;
      if (filter.shopId) where.shopId = filter.shopId;

      if (filter.fromDate || filter.toDate) {
        where.createdAt = {};
        if (filter.fromDate) where.createdAt.gte = new Date(filter.fromDate);
        if (filter.toDate) where.createdAt.lte = new Date(filter.toDate);
      }
    }

    return where;
  }
}
