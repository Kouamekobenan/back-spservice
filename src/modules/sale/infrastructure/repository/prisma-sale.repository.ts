import { Injectable, Logger, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { Sale } from '../../domain/entities/sale.entity.js';
import { CreateSaleDto } from '../../application/dtos/create-sale.dto.js';
import { FilterSaleDto } from '../../application/dtos/filter-sale.dto.js';
import { RefundSaleDto } from '../../application/dtos/refund-sale.dto.js';
import { SaleMapper } from '../../domain/mappers/sale.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { StockMovementReason, PaymentMethod, Prisma } from '@prisma/client';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

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
        // 1. Fetch all products in one query (single round-trip avec IN)
        const productIds = data.items.map((i) => i.productId);
        const productList = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        type PRow = (typeof productList)[0];
        const productMap = new Map<string, PRow>(productList.map((p) => [p.id, p]));
        const products = data.items.map((i) => productMap.get(i.productId) ?? null);

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

  // ── VOID ─────────────────────────────────────────────────────────────────────

  async voidSale(saleId: string, userId: string, reason: string): Promise<Sale> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          include: { items: true, payments: true },
        });

        if (!sale) throw new NotFoundException(`Vente ${saleId} non trouvée`);

        if (!['COMPLETED', 'PARTIALLY_PAID'].includes(sale.status)) {
          throw new BadRequestException(
            `Impossible d'annuler une vente avec le statut "${sale.status}"`,
          );
        }

        // Mise à jour du statut
        const updated = await tx.sale.update({
          where: { id: saleId },
          data: {
            status: 'VOIDED',
            notes: sale.notes ? `${sale.notes} | ANNULÉ: ${reason}` : `ANNULÉ: ${reason}`,
          },
          include: { items: true, payments: true },
        });

        // Restitution du stock (batch — 1 query au lieu de N)
        const voidProductIds = sale.items.map((i) => i.productId);
        const voidProducts = await tx.product.findMany({
          where: { id: { in: voidProductIds } },
          select: { id: true, stockQty: true },
        });
        type VRow = (typeof voidProducts)[0];
        const voidStockMap = new Map<string, VRow>(voidProducts.map((p) => [p.id, p]));

        await Promise.all(
          sale.items.map(async (item) => {
            const stockBefore = Number(voidStockMap.get(item.productId)!.stockQty);
            const qty = Number(item.quantity);
            await Promise.all([
              tx.product.update({
                where: { id: item.productId },
                data: { stockQty: { increment: qty } },
              }),
              tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  shopId: sale.shopId,
                  userId,
                  reason: StockMovementReason.RETURN_IN,
                  quantity: qty,
                  stockBefore,
                  stockAfter: stockBefore + qty,
                  saleId: sale.id,
                  notes: `Annulation vente ${sale.receiptNumber}`,
                },
              }),
            ]);
          }),
        );

        // Réduction de la dette client si paiement CREDIT
        const creditPayment = sale.payments.find((p) => p.method === PaymentMethod.CREDIT);
        if (creditPayment && sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { totalDebt: { decrement: Number(creditPayment.amount) } },
          });
        }

        return this.mapper.toDomain(updated);
      });
    } catch (error) {
      this.logger.error('Erreur lors de l\'annulation de la vente', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Échec de l\'annulation de la vente');
    }
  }

  // ── REFUND ───────────────────────────────────────────────────────────────────

  async refundSale(saleId: string, dto: RefundSaleDto, receiptNumber: string): Promise<Sale> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const originalSale = await tx.sale.findUnique({
          where: { id: saleId },
          include: { items: true, payments: true },
        });

        if (!originalSale) throw new NotFoundException(`Vente ${saleId} non trouvée`);

        if (!['COMPLETED', 'PARTIALLY_PAID'].includes(originalSale.status)) {
          throw new BadRequestException(
            `Impossible de rembourser une vente avec le statut "${originalSale.status}"`,
          );
        }

        // Construction des articles à rembourser (total ou partiel)
        type RefundLine = {
          productId: string; productName: string; productSku: string | null;
          quantity: number; unitPrice: number; discount: number; totalPrice: number;
        };

        let lines: RefundLine[];

        if (!dto.items || dto.items.length === 0) {
          lines = originalSale.items.map((item) => ({
            productId:   item.productId,
            productName: item.productName,
            productSku:  item.productSku,
            quantity:    Number(item.quantity),
            unitPrice:   Number(item.unitPrice),
            discount:    Number(item.discount),
            totalPrice:  Number(item.totalPrice),
          }));
        } else {
          lines = [];
          for (const refundItem of dto.items) {
            const orig = originalSale.items.find((i) => i.id === refundItem.saleItemId);
            if (!orig) {
              throw new BadRequestException(
                `Article ${refundItem.saleItemId} non trouvé dans la vente originale`,
              );
            }
            if (refundItem.quantity > Number(orig.quantity)) {
              throw new BadRequestException(
                `Quantité à rembourser (${refundItem.quantity}) supérieure à la quantité vendue (${orig.quantity}) pour "${orig.productName}"`,
              );
            }
            const ratio = refundItem.quantity / Number(orig.quantity);
            lines.push({
              productId:   orig.productId,
              productName: orig.productName,
              productSku:  orig.productSku,
              quantity:    refundItem.quantity,
              unitPrice:   Number(orig.unitPrice),
              discount:    Number(orig.discount),
              totalPrice:  Number(orig.totalPrice) * ratio,
            });
          }
        }

        const subtotal    = lines.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const totalAmount = lines.reduce((s, i) => s + i.totalPrice, 0);

        // Création de la vente de remboursement
        const refundSale = await tx.sale.create({
          data: {
            receiptNumber,
            shopId:         originalSale.shopId,
            userId:         dto.userId,
            customerId:     originalSale.customerId,
            cashSessionId:  originalSale.cashSessionId,
            originalSaleId: saleId,
            status:         'REFUNDED',
            subtotal,
            discountAmount: 0,
            taxAmount:      0,
            totalAmount,
            paidAmount:     totalAmount,
            changeAmount:   0,
            notes:          `Remboursement de ${originalSale.receiptNumber}. Raison: ${dto.reason}`,
            items: {
              create: lines.map((l) => ({
                productId:   l.productId,
                productName: l.productName,
                productSku:  l.productSku,
                quantity:    l.quantity,
                unitPrice:   l.unitPrice,
                discount:    l.discount,
                totalPrice:  l.totalPrice,
              })),
            },
            payments: {
              create: [{ method: dto.paymentMethod, amount: totalAmount, reference: dto.reference }],
            },
          },
          include: { items: true, payments: true },
        });

        // Restitution du stock si demandée (batch — 1 query au lieu de N)
        if (dto.returnToStock) {
          const returnIds = lines.map((l) => l.productId);
          const returnProducts = await tx.product.findMany({
            where: { id: { in: returnIds } },
            select: { id: true, stockQty: true },
          });
          type RRow = (typeof returnProducts)[0];
          const returnMap = new Map<string, RRow>(returnProducts.map((p) => [p.id, p]));

          await Promise.all(
            lines.map(async (l) => {
              const stockBefore = Number(returnMap.get(l.productId)!.stockQty);
              await Promise.all([
                tx.product.update({
                  where: { id: l.productId },
                  data: { stockQty: { increment: l.quantity } },
                }),
                tx.stockMovement.create({
                  data: {
                    productId:   l.productId,
                    shopId:      originalSale.shopId,
                    userId:      dto.userId,
                    reason:      StockMovementReason.RETURN_IN,
                    quantity:    l.quantity,
                    stockBefore,
                    stockAfter:  stockBefore + l.quantity,
                    saleId:      refundSale.id,
                    notes:       `Retour produit - Remboursement ${originalSale.receiptNumber}`,
                  },
                }),
              ]);
            }),
          );
        }

        // Réduction proportionnelle de la dette client si CREDIT
        if (originalSale.customerId) {
          const creditPayment = originalSale.payments.find((p) => p.method === PaymentMethod.CREDIT);
          if (creditPayment) {
            const ratio       = totalAmount / Number(originalSale.totalAmount);
            const debtReduced = Number(creditPayment.amount) * ratio;
            if (debtReduced > 0) {
              await tx.customer.update({
                where: { id: originalSale.customerId },
                data:  { totalDebt: { decrement: debtReduced } },
              });
            }
          }
        }

        return this.mapper.toDomain(refundSale);
      });
    } catch (error) {
      this.logger.error('Erreur lors du remboursement de la vente', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Échec du remboursement de la vente');
    }
  }

  async findAll(filters: FilterSaleDto): Promise<PaginatedResponseRepository<Sale>> {
    const page  = Number(filters.page  ?? 1);
    const limit = Number(filters.limit ?? 30);
    const skip  = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (filters.shopId)       where.shopId       = filters.shopId;
    if (filters.status)       where.status        = filters.status;
    if (filters.userId)       where.userId        = filters.userId;
    if (filters.customerId)   where.customerId    = filters.customerId;
    if (filters.cashSessionId) where.cashSessionId = filters.cashSessionId;

    if (filters.search) {
      where.receiptNumber = { contains: filters.search };
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate)   where.createdAt.lte = new Date(filters.toDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: { items: true, payments: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.sale.count({ where }),
    ]);
    return {
      data:sales.map((s) => this.mapper.toDomain(s)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }
}
