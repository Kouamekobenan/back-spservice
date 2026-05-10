import { Injectable, Logger, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { IStockTransferRepository } from '../../domain/interfaces/stock-transfer.repository.interface.js';
import { StockTransfer, StockTransferStatus } from '../../domain/entities/stock-transfer.entity.js';
import { CreateStockTransferDto } from '../../application/dtos/create-stock-transfer.dto.js';
import { StockTransferMapper } from '../../domain/mappers/stock-transfer.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { StockMovementReason } from '@prisma/client';

@Injectable()
export class PrismaStockTransferRepository implements IStockTransferRepository {
  private readonly logger = new Logger(PrismaStockTransferRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: StockTransferMapper,
  ) {}

  async generateTransferNumber(fromShopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.stockTransfer.count({
      where: {
        fromShopId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    return `TRF-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async create(data: CreateStockTransferDto, transferNumber: string): Promise<StockTransfer> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Create StockTransfer
        const transfer = await tx.stockTransfer.create({
          data: {
            transferNumber,
            fromShopId: data.fromShopId,
            toShopId: data.toShopId,
            status: StockTransferStatus.PENDING,
            notes: data.notes,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
              })),
            },
          },
          include: { items: true },
        });

        // 2. Decrement stock from origin and create movement
        for (const item of data.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new BadRequestException(`Produit ${item.productId} non trouvé.`);
          if (product.shopId !== data.fromShopId) {
            throw new BadRequestException(`Le produit ${product.name} n'appartient pas à la boutique source.`);
          }
          if (Number(product.stockQty) < item.quantity) {
             throw new BadRequestException(`Stock insuffisant pour le produit ${product.name} (Disponible: ${product.stockQty}).`);
          }

          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              shopId: data.fromShopId,
              userId: data.userId,
              reason: StockMovementReason.TRANSFER_OUT,
              quantity: -item.quantity,
              stockBefore: Number(product.stockQty),
              stockAfter: Number(updatedProduct.stockQty),
              transferId: transfer.id,
              notes: `Transfert vers boutique ${data.toShopId}`,
            },
          });
        }

        return this.mapper.toDomain(transfer);
      });
    } catch (error) {
      this.logger.error('Erreur lors de la création du transfert de stock', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Échec de la création du transfert');
    }
  }

  async findById(id: string): Promise<StockTransfer | null> {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });
    return transfer ? this.mapper.toDomain(transfer) : null;
  }

  async findAll(filters: { fromShopId?: string; toShopId?: string; status?: StockTransferStatus }): Promise<StockTransfer[]> {
    const transfers = await this.prisma.stockTransfer.findMany({
      where: {
        fromShopId: filters.fromShopId,
        toShopId: filters.toShopId,
        status: filters.status,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return transfers.map((t) => this.mapper.toDomain(t));
  }

  async updateStatus(id: string, status: StockTransferStatus, userId: string): Promise<StockTransfer> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const transfer = await tx.stockTransfer.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!transfer) throw new NotFoundException('Transfert non trouvé.');

        if (status === StockTransferStatus.COMPLETED) {
          // Process reception in destination shop
          for (const item of transfer.items) {
            // Find equivalent product in target shop by SKU or Barcode
            const sourceProduct = await tx.product.findUnique({ where: { id: item.productId } });
            if (!sourceProduct) throw new BadRequestException('Produit source non trouvé.');

            let targetProduct: any = null; // Utilisation de any ou du type Product si importé

            if (sourceProduct.sku) {
              targetProduct = await tx.product.findFirst({
                where: {
                  shopId: transfer.toShopId,
                  sku: sourceProduct.sku,
                }
              });
            }

            if (!targetProduct && sourceProduct.barcode) {
              targetProduct = await tx.product.findFirst({
                where: {
                  shopId: transfer.toShopId,
                  barcode: sourceProduct.barcode,
                }
              });
            }

            if (!targetProduct) {
              // Option: Auto-create product in target shop? 
              // For safety, we throw error asking to create it first, or we clone it.
              // Let's clone it for a better UX.
              targetProduct = await tx.product.create({
                data: {
                  name: sourceProduct.name,
                  barcode: sourceProduct.barcode,
                  sku: sourceProduct.sku,
                  description: sourceProduct.description,
                  buyingPrice: sourceProduct.buyingPrice,
                  sellingPrice: sourceProduct.sellingPrice,
                  wholeSalePrice: sourceProduct.wholeSalePrice,
                  minStockQty: sourceProduct.minStockQty,
                  maxStockQty: sourceProduct.maxStockQty,
                  categoryId: sourceProduct.categoryId,
                  unitId: sourceProduct.unitId,
                  shopId: transfer.toShopId,
                  stockQty: 0,
                }
              });
            }

            const updatedTargetProduct = await tx.product.update({
              where: { id: targetProduct.id },
              data: { stockQty: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: targetProduct.id,
                shopId: transfer.toShopId,
                userId: userId,
                reason: StockMovementReason.TRANSFER_IN,
                quantity: item.quantity,
                stockBefore: Number(targetProduct.stockQty),
                stockAfter: Number(updatedTargetProduct.stockQty),
                transferId: transfer.id,
                notes: `Réception depuis boutique ${transfer.fromShopId}`,
              },
            });
          }
        } else if (status === StockTransferStatus.CANCELLED) {
          // Process cancellation: Return stock to origin
          for (const item of transfer.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) continue; // Should not happen

            const updatedProduct = await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                shopId: transfer.fromShopId,
                userId: userId,
                reason: StockMovementReason.ADJUSTMENT,
                quantity: item.quantity,
                stockBefore: Number(product.stockQty),
                stockAfter: Number(updatedProduct.stockQty),
                transferId: transfer.id,
                notes: `Annulation du transfert ${transfer.transferNumber}`,
              },
            });
          }
        }

        const updatedTransfer = await tx.stockTransfer.update({
          where: { id },
          data: { status },
          include: { items: true },
        });

        return this.mapper.toDomain(updatedTransfer);
      });
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du statut du transfert', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Échec de la mise à jour du transfert');
    }
  }
}
