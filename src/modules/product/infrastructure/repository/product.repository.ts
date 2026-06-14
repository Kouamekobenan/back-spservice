import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface.js';
import { ProductMapper } from '../../domain/mappers/product.mapper.js';
import { CreateProductDto } from '../../application/dtos/create-product.dto.js';
import { UpdateProductDto } from '../../application/dtos/update-product.dto.js';
import { ProductQueryDto } from '../../application/dtos/product-query.dto.js';
import { Product } from '../../domain/entities/product.entity.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

const isSQLite = () => process.env.DATABASE_PROVIDER === 'sqlite';
const caseInsensitive = () => (isSQLite() ? {} : { mode: 'insensitive' as const });

@Injectable()
export class ProductRepository implements IProductRepository {
  private readonly logger = new Logger(ProductRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ProductMapper,
  ) {}

  async create(data: CreateProductDto): Promise<Product> {
    try {
      const createData = this.mapper.toPersistence(data);
      const product = await this.prisma.product.create({ data: createData });
      return this.mapper.toDomain(product);
    } catch (error) {
      this.logger.error('Failed to create product', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      return product ? this.mapper.toDomain(product) : null;
    } catch (error) {
      this.logger.error(`Failed to find product: ${id}`);
      throw new InternalServerErrorException('Error during search');
    }
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResponseRepository<Product>> {
    try {
      const { page = 1, limit = 200, search, barcode, shopId, categoryId, isLowStock } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = { isActive: true };

      if (shopId) where.shopId = shopId;
      if (categoryId) where.categoryId = categoryId;

      // Filtre exact par barcode (prioritaire sur search)
      if (barcode) {
        where.barcode = { equals: barcode, ...caseInsensitive() };
      } else if (search) {
        where.OR = [
          { name: { contains: search, ...caseInsensitive() } },
          { barcode: { contains: search, ...caseInsensitive() } },
          { sku: { contains: search, ...caseInsensitive() } },
        ];
      }

      if (isLowStock) {
        where.stockQty = {
          lte: this.prisma.product.fields.minStockQty,
        };
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        data: products.map((p) => this.mapper.toDomain(p)),
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to paginate products');
      throw new BadRequestException('Error during pagination');
    }
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    try {
      const updateData = this.mapper.toUpdatePersistence(data);
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
      });
      return this.mapper.toDomain(product);
    } catch (error) {
      this.logger.error(`Failed to update product: ${id}`);
      throw new InternalServerErrorException('Error during update');
    }
  }

  async hasSalesHistory(id: string): Promise<boolean> {
    const count = await this.prisma.saleItem.count({ where: { productId: id } });
    return count > 0;
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    } catch (error) {
      this.logger.error(`Failed to soft-delete product: ${id}`);
      throw new InternalServerErrorException('Error during deletion');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete product: ${id}`);
      throw new InternalServerErrorException('Error during deletion');
    }
  }

  async findByBarcode(barcode: string, shopId: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { barcode, shopId },
    });
    return product ? this.mapper.toDomain(product) : null;
  }

  async findByBarcodeExact(barcode: string, shopId?: string): Promise<Product | null> {
    const where: Prisma.ProductWhereInput = {
      barcode: { equals: barcode, ...caseInsensitive() },
    };
    if (shopId) where.shopId = shopId;
    const product = await this.prisma.product.findFirst({ where });
    return product ? this.mapper.toDomain(product) : null;
  }

  async findBySku(sku: string, shopId: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { sku, shopId },
    });
    return product ? this.mapper.toDomain(product) : null;
  }

  async getLowStockAlerts(shopId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        stockQty: {
          lte: this.prisma.product.fields.minStockQty,
        },
      },
    });
    return products.map((p) => this.mapper.toDomain(p));
  }
async generateUniqueBarcode(shopId: string): Promise<string> {
  let isUnique = false;
  let barcode = '';
  
  while (!isUnique) {
    // Générer un code-barres aléatoire (ex: 12 chiffres)
    barcode = Math.random().toString(36).substring(2, 14).toUpperCase();
    
    // Vérifier si ce code-barres existe déjà dans la boutique
    const existingProduct = await this.prisma.product.findFirst({
      where: { barcode, shopId }
    });
    
    if (!existingProduct) {
      isUnique = true;
    }
  }
  
  return barcode;
} 
  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        stockQty: {
          increment: quantity,
        },
      },
    });
    return this.mapper.toDomain(product);
  }
}
