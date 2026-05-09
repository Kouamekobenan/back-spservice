import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IPurchaseOrderRepository } from '../../domain/interfaces/purchase-order-repository.interface.js';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity.js';
import { CreatePurchaseOrderDto } from '../../application/dtos/create-purchase-order.dto.js';
import { PurchaseOrderQueryDto } from '../../application/dtos/purchase-order-query.dto.js';
import { ReceiveItemsDto } from '../../application/dtos/receive-items.dto.js';
import { PurchaseOrderMapper } from '../../domain/mappers/purchase-order.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PurchaseOrderStatus, StockMovementReason, Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class PrismaPurchaseOrderRepository implements IPurchaseOrderRepository {
  private readonly logger = new Logger(PrismaPurchaseOrderRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PurchaseOrderMapper,
  ) {}

  async generateOrderNumber(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.purchaseOrder.count({
      where: {
        shopId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    return `CMD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async create(data: CreatePurchaseOrderDto, orderNumber: string): Promise<PurchaseOrder> {
    try {
      const subtotal = data.items.reduce((sum, item) => sum + (item.unitCost * item.quantityOrdered), 0);
      
      const order = await this.prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: data.supplierId,
          shopId: data.shopId,
          status: PurchaseOrderStatus.DRAFT,
          subtotal,
          totalAmount: subtotal, // For now, no taxes/discounts on PO
          expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
          notes: data.notes,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantityOrdered: item.quantityOrdered,
              unitCost: item.unitCost,
              totalCost: item.unitCost * item.quantityOrdered,
            })),
          },
        },
        include: { items: true },
      });

      return this.mapper.toDomain(order);
    } catch (error) {
      this.logger.error('Failed to create purchase order', error);
      throw new InternalServerErrorException('Erreur lors de la création du bon de commande');
    }
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    return order ? this.mapper.toDomain(order) : null;
  }

  async findAll(query: PurchaseOrderQueryDto): Promise<PaginatedResponseRepository<PurchaseOrder>> {
    const { page = 1, limit = 10, shopId, supplierId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (shopId) where.shopId = shopId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders.map(o => this.mapper.toDomain(o)),
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return this.mapper.toDomain(order);
  }

  async receiveItems(id: string, data: ReceiveItemsDto, userId: string): Promise<PurchaseOrder> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!order) throw new NotFoundException(`Bon de commande ${id} non trouvé`);

        for (const receivedItem of data.items) {
          const originalItem = order.items.find(i => i.productId === receivedItem.productId);
          if (!originalItem) continue;

          // 1. Update quantityReceived in PO Item
          const newQtyReceived = Number(originalItem.quantityReceived) + receivedItem.quantityReceived;
          await tx.purchaseOrderItem.update({
            where: { id: originalItem.id },
            data: { quantityReceived: newQtyReceived },
          });

          // 2. Update Product stock
          const product = await tx.product.update({
            where: { id: receivedItem.productId },
            data: { 
                stockQty: { increment: receivedItem.quantityReceived },
                buyingPrice: originalItem.unitCost // Update buying price to last cost
            },
          });

          // 3. Create Stock Movement
          await tx.stockMovement.create({
            data: {
              productId: receivedItem.productId,
              shopId: order.shopId,
              userId: userId,
              reason: StockMovementReason.PURCHASE,
              quantity: receivedItem.quantityReceived,
              stockBefore: Number(product.stockQty) - receivedItem.quantityReceived,
              stockAfter: Number(product.stockQty),
              purchaseOrderId: order.id,
              notes: `Réception bon de commande ${order.orderNumber}`,
            },
          });
        }

        // Check if fully received
        const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
        const allReceived = updatedItems.every(i => Number(i.quantityReceived) >= Number(i.quantityOrdered));
        const someReceived = updatedItems.some(i => Number(i.quantityReceived) > 0);

        let newStatus = order.status;
        if (allReceived) newStatus = PurchaseOrderStatus.RECEIVED;
        else if (someReceived) newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;

        const updatedOrder = await tx.purchaseOrder.update({
          where: { id },
          data: { 
            status: newStatus,
            receivedAt: allReceived ? new Date() : order.receivedAt
          },
          include: { items: true },
        });

        return this.mapper.toDomain(updatedOrder);
      });
    } catch (error) {
      this.logger.error(`Failed to receive items for PO ${id}`, error);
      throw error;
    }
  }
}
