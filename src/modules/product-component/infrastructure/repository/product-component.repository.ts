import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { IProductComponentRepository } from '../../domain/interfaces/product-component-repository.interface.js';
import { ProductComponentMapper } from '../../domain/mappers/product-component.mapper.js';
import { ProductComponent } from '../../domain/entities/product-component.entity.js';
import { AddProductComponentDto } from '../../application/dtos/add-component.dto.js';
import { UpdateProductComponentQtyDto } from '../../application/dtos/update-component-qty.dto.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductComponentRepository implements IProductComponentRepository {
  private readonly logger = new Logger(ProductComponentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ProductComponentMapper,
  ) {}

  async addComponent(data: AddProductComponentDto): Promise<ProductComponent> {
    try {
      const result = await this.prisma.productComponent.create({
        data: {
          composedId: data.composedId,
          componentId: data.componentId,
          quantity: new Prisma.Decimal(data.quantity),
        },
        include: {
          component: true,
        },
      });
      return this.mapper.toDomain(result);
    } catch (error) {
      this.logger.error('Failed to add component to kit', error);
      throw new InternalServerErrorException('Erreur lors de l\'ajout du composant');
    }
  }

  async removeComponent(id: string): Promise<void> {
    try {
      await this.prisma.productComponent.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to remove component: ${id}`, error);
      throw new InternalServerErrorException('Erreur lors de la suppression du composant');
    }
  }

  async updateQuantity(id: string, data: UpdateProductComponentQtyDto): Promise<ProductComponent> {
    try {
      const result = await this.prisma.productComponent.update({
        where: { id },
        data: {
          quantity: new Prisma.Decimal(data.quantity),
        },
        include: {
          component: true,
        },
      });
      return this.mapper.toDomain(result);
    } catch (error) {
      this.logger.error(`Failed to update quantity for component: ${id}`, error);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de la quantité');
    }
  }

  async findByKitId(kitId: string): Promise<ProductComponent[]> {
    try {
      const results = await this.prisma.productComponent.findMany({
        where: { composedId: kitId },
        include: {
          component: true,
        },
      });
      return results.map((r) => this.mapper.toDomain(r));
    } catch (error) {
      this.logger.error(`Failed to find components for kit: ${kitId}`, error);
      throw new InternalServerErrorException('Erreur lors de la récupération de la composition');
    }
  }

  async findById(id: string): Promise<ProductComponent | null> {
    const result = await this.prisma.productComponent.findUnique({
      where: { id },
      include: {
        component: true,
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async exists(composedId: string, componentId: string): Promise<boolean> {
    const count = await this.prisma.productComponent.count({
      where: { composedId, componentId },
    });
    return count > 0;
  }
}
