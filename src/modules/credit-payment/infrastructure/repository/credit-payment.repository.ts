import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ICreditPaymentRepository } from '../../domain/interfaces/credit-payment.interface.repository.js';
import { CreditPaymentMapper } from '../../domain/mappers/credit-payment.mapper.js';
import { CreateCreditPaymentDto } from '../../application/dtos/create-credit-payment.dto.js';
import { FilterCreditPaymentDto } from '../../application/dtos/filter-credit-payment.dto.js';
import { CreditPayment } from '../../domain/entities/credit-payment.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class CreditPaymentRepository implements ICreditPaymentRepository {
  private readonly logger = new Logger(CreditPaymentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CreditPaymentMapper,
  ) {}

  async createPayment(data: CreateCreditPaymentDto): Promise<CreditPayment> {
    try {
      const createData = this.mapper.toPersistence(data);
      const payment = await this.prisma.creditPayment.create({ data: createData });
      return this.mapper.toApplication(payment);
    } catch (error) {
      this.logger.error('Échec de la création du paiement', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async getPaymentById(id: string): Promise<CreditPayment | null> {
    try {
      const payment = await this.prisma.creditPayment.findUnique({
        where: { id },
      });
      return payment ? this.mapper.toApplication(payment) : null;
    } catch (error) {
      this.logger.error(`Échec de la récupération du paiement: ${id}`);
      throw new InternalServerErrorException('Erreur lors de la recherche');
    }
  }

  async getPaymentsByCustomer(customerId: string): Promise<CreditPayment[]> {
    try {
      const payments = await this.prisma.creditPayment.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
      return payments.map((p) => this.mapper.toApplication(p));
    } catch (error) {
      this.logger.error(`Échec de la récupération des paiements du client: ${customerId}`);
      throw new InternalServerErrorException('Erreur lors de la récupération');
    }
  }

  async paginate(
    page: number,
    limit: number,
    search?: FilterCreditPaymentDto,
  ): Promise<PaginatedResponseRepository<CreditPayment>> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.CreditPaymentWhereInput = {};

      if (search?.customerId) where.customerId = search.customerId;
      if (search?.method) where.method = search.method;
      if (search?.reference) {
        where.reference = { contains: search.reference, mode: 'insensitive' };
      }

      const [payments, total] = await Promise.all([
        this.prisma.creditPayment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.creditPayment.count({ where }),
      ]);

      return {
        data: payments.map((p) => this.mapper.toApplication(p)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Échec de la pagination des paiements');
      throw new BadRequestException('Erreur lors de la pagination');
    }
  }
}
