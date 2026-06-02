import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { Sale } from '../../domain/entities/sale.entity.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';
import { SaleMapper } from '../../domain/mappers/sale.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { StockMovementReason, PaymentMethod } from '@prisma/client';

@Injectable()
export class PrismaSaleRepository implements ISaleRepository {
  private readonly logger = new Logger(PrismaSaleRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: SaleMapper,
  ) {}

  async generateReceiptNumber(shopId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.sale.count({
      where: {
        shopId,
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    return `SP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async create(data: CreateSaleDto, receiptNumber: string): Promise<Sale> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Fetch all products in parallel (single round-trip)
        const products = await Promise.all(
          data.items.map(item => tx.product.findUnique({ where: { id: item.productId } }))
        );

        // 2. Validate existence and stock before any write
        for (let i = 0; i < data.items.length; i++) {
          const product = products[i];
          const item = data.items[i];
          if (!product) {
            throw new BadRequestException(`Produit ${item.productId} non trouvé`);
          }
          if (Number(product.stockQty) < item.quantity) {
            throw new BadRequestException(
              `Stock insuffisant pour "${product.name}" (disponible : ${product.stockQty}, demandé : ${item.quantity})`
            );
          }
        }

        // 3. Calculate totals
        const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const discountAmount = data.discountAmount || 0;
        const taxAmount = data.taxAmount || 0;
        const totalAmount = subtotal - discountAmount + taxAmount;
        const totalPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
        const changeAmount = Math.max(0, totalPaid - totalAmount);

        // 4. Create sale + items + payments (reuse product data already fetched)
        const sale = await tx.sale.create({
          data: {
            receiptNumber,
            shopId: data.shopId,
            userId: data.userId,
            customerId: data.customerId,
            cashSessionId: data.cashSessionId,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paidAmount: totalPaid - changeAmount,
            changeAmount,
            notes: data.notes,
            items: {
              create: data.items.map((item, i) => ({
                productId: item.productId,
                productName: products[i]!.name,
                productSku: products[i]!.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                totalPrice: (item.unitPrice - (item.discount || 0)) * item.quantity,
              })),
            },
            payments: {
              create: data.payments.map((p) => ({
                method: p.method,
                amount: p.amount,
                reference: p.reference,
              })),
            },
          },
          include: { items: true, payments: true },
        });

        // 5. Update stock + create movements in parallel (no extra product fetch)
        await Promise.all(
          data.items.map(async (item, i) => {
            const stockBefore = Number(products[i]!.stockQty);
            const stockAfter = stockBefore - item.quantity;
            await Promise.all([
              tx.product.update({
                where: { id: item.productId },
                data: { stockQty: { decrement: item.quantity } },
              }),
              tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  shopId: data.shopId,
                  userId: data.userId,
                  reason: StockMovementReason.SALE,
                  quantity: -item.quantity,
                  stockBefore,
                  stockAfter,
                  saleId: sale.id,
                },
              }),
            ]);
          })
        );

        // 6. Update customer debt if CREDIT payment
        const creditPayment = data.payments.find(p => p.method === PaymentMethod.CREDIT);
        if (creditPayment && data.customerId) {
          await tx.customer.update({
            where: { id: data.customerId },
            data: { totalDebt: { increment: creditPayment.amount } },
          });
        }

        return this.mapper.toDomain(sale);
      });
    } catch (error) {
      this.logger.error('Erreur lors de la création de la vente', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Échec du traitement de la vente');
    }
  }

  async findById(id: string): Promise<Sale | null> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    return sale ? this.mapper.toDomain(sale) : null;
  }

  async findAll(filters: any): Promise<Sale[]> {
    const limit = filters.limit ?? 30;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    const sales = await this.prisma.sale.findMany({
      where: { shopId: filters.shopId },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
    return sales.map(s => this.mapper.toDomain(s));
  }
}
