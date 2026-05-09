import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { IProductBatchRepository } from '../../domain/interfaces/product-batch-repository.interface.js';
import { ProductBatchMapper } from '../../domain/mappers/product-batch.mapper.js';
import { ProductBatch } from '../../domain/entities/product-batch.entity.js';
import { CreateProductBatchDto } from '../../application/dtos/create-batch.dto.js';
import { UpdateProductBatchDto } from '../../application/dtos/update-batch.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductBatchRepository implements IProductBatchRepository {
  private readonly logger = new Logger(ProductBatchRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ProductBatchMapper,
  ) {}

  async create(data: CreateProductBatchDto): Promise<ProductBatch> {
    try {
      const result = await this.prisma.productBatch.create({
        data: {
          productId: data.productId,
          batchNumber: data.batchNumber,
          quantity: new Prisma.Decimal(data.quantity),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          buyingPrice: new Prisma.Decimal(data.buyingPrice),
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        },
      });
      return this.mapper.toDomain(result);
    } catch (error) {
      this.logger.error('Failed to create batch', error);
      throw new InternalServerErrorException('Erreur lors de la création du lot');
    }
  }

  async findById(id: string): Promise<ProductBatch | null> {
    const result = await this.prisma.productBatch.findUnique({ where: { id } });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findByProductId(productId: string): Promise<ProductBatch[]> {
    const results = await this.prisma.productBatch.findMany({
      where: { productId },
      orderBy: { expiresAt: 'asc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async update(id: string, data: UpdateProductBatchDto): Promise<ProductBatch> {
    try {
      const updateData: Prisma.ProductBatchUpdateInput = {};
      if (data.quantity !== undefined) updateData.quantity = new Prisma.Decimal(data.quantity);
      if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber;
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      if (data.buyingPrice !== undefined) updateData.buyingPrice = new Prisma.Decimal(data.buyingPrice);

      const result = await this.prisma.productBatch.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toDomain(result);
    } catch (error) {
      this.logger.error(`Failed to update batch: ${id}`, error);
      throw new InternalServerErrorException('Erreur lors de la mise à jour du lot');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.productBatch.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete batch: ${id}`, error);
      throw new InternalServerErrorException('Erreur lors de la suppression du lot');
    }
  }

  async getExpiringSoon(shopId: string, days: number): Promise<ProductBatch[]> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() + days);

    const results = await this.prisma.productBatch.findMany({
      where: {
        product: { shopId },
        expiresAt: {
          lte: dateLimit,
          not: null,
        },
        quantity: { gt: 0 },
      },
      orderBy: { expiresAt: 'asc' },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }
}
