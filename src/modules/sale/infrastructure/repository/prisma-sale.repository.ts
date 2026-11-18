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
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    const count = await this.prisma.sale.count({
      where: {
        shopId,
        createdAt: {
          gte: startOfDay,
        },
      },
    });
    return `SP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async create(data: CreateSaleDto, receiptNumber: string): Promise<Sale> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Fetch all products in one query (par id ou localId)
        const requestedProductIds = [...new Set(data.items.map((i) => i.productId))];
        const productList = await tx.product.findMany({
          where: {
            OR: [
              { id: { in: requestedProductIds } },
              { localId: { in: requestedProductIds } },
            ],
          },
        });
        type PRow = (typeof productList)[0];
        const productMap = new Map<string, PRow>();
        for (const p of productList) {
          productMap.set(p.id, p);
          if (p.localId) productMap.set(p.localId, p);
        }
        const products = data.items.map((i) => productMap.get(i.productId) ?? null);

        // Vérifier le paramètre boutique allowNegativeStock (true par défaut pour ne jamais bloquer la caisse)
        const negStockSetting = await tx.shopSetting.findUnique({
          where: {
            shopId_key: {
              shopId: data.shopId,
              key: 'allowNegativeStock',
            },
          },
        });
        const allowNegativeStock = negStockSetting?.value !== 'false';

        // 2. Validate existence and cumulative stock per product
        const cumulativeQty = new Map<string, number>();
        for (let i = 0; i < data.items.length; i++) {
          const product = products[i];
          const item = data.items[i];
          if (!product) {
            throw new BadRequestException(`Produit ${item.productId} non trouvé`);
          }
          const prevQty = cumulativeQty.get(product.id) ?? 0;
          const newTotalQty = prevQty + Number(item.quantity);
          cumulativeQty.set(product.id, newTotalQty);

          if (Number(product.stockQty) < newTotalQty) {
            if (!allowNegativeStock) {
              throw new BadRequestException(
                `Stock insuffisant pour "${product.name}" (disponible : ${product.stockQty}, demandé : ${newTotalQty})`,
              );
            }
            this.logger.warn(
              `⚠️ Stock théorique insuffisant pour "${product.name}" (shop=${data.shopId}, disponible=${product.stockQty}, vendu=${newTotalQty}) — vente autorisée en caisse.`,
            );
          }
        }

        // Résoudre customerId et cashSessionId (supporte UUID serveur ou localId hors-ligne)
        let resolvedCustomerId: string | undefined = data.customerId;
        if (data.customerId) {
          const customer = await tx.customer.findFirst({
            where: { OR: [{ id: data.customerId }, { localId: data.customerId }] },
            select: { id: true },
          });
          if (!customer) {
            throw new BadRequestException(`Client ${data.customerId} non trouvé`);
          }
          resolvedCustomerId = customer.id;
        }

        let resolvedCashSessionId: string | undefined = data.cashSessionId;
        if (data.cashSessionId) {
          const session = await tx.cashSession.findFirst({
            where: { OR: [{ id: data.cashSessionId }, { localId: data.cashSessionId }] },
            select: { id: true },
          });
          resolvedCashSessionId = session ? session.id : undefined;
        }

        // 3. Calculate totals (en prenant en compte les remises par ligne de manière cohérente)
        const preparedItems = data.items.map((item, i) => {
          const product = products[i]!;
          const qty = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const discount = Number(item.discount || 0);
          const totalPrice = Math.max(0, (unitPrice - discount) * qty);
          return {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: qty,
            unitPrice,
            discount,
            totalPrice,
          };
        });

        const subtotal = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountAmount = Number(data.discountAmount || 0);
        const taxAmount = Number(data.taxAmount || 0);
        const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

        const totalTendered = (data.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
        const creditAmount = (data.payments || [])
          .filter((p) => p.method === PaymentMethod.CREDIT)
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const nonCreditTendered = totalTendered - creditAmount;

        if (creditAmount > 0 && !resolvedCustomerId) {
          throw new BadRequestException(
            'Un client doit être associé à la vente pour un paiement à crédit.',
          );
        }

        if (totalTendered < totalAmount && !resolvedCustomerId) {
          throw new BadRequestException(
            `Montant payé (${totalTendered}) inférieur au total de la vente (${totalAmount}).`,
          );
        }

        const amountDueImmediate = Math.max(0, totalAmount - creditAmount);
        const changeAmount = Math.max(0, nonCreditTendered - amountDueImmediate);
        const paidAmount = Math.max(0, nonCreditTendered - changeAmount);
        const totalDebtToAdd = creditAmount + Math.max(0, totalAmount - totalTendered);
        const status = totalDebtToAdd > 0 ? 'PARTIALLY_PAID' : 'COMPLETED';

        // 4. Create sale + items + payments
        const sale = await tx.sale.create({
          data: {
            receiptNumber,
            status,
            shopId: data.shopId,
            userId: data.userId,
            customerId: resolvedCustomerId,
            cashSessionId: resolvedCashSessionId,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paidAmount,
            changeAmount,
            notes: data.notes,
            items: {
              create: preparedItems,
            },
            payments: {
              create: (data.payments || []).map((p) => ({
                method: p.method,
                amount: p.amount,
                reference: p.reference,
              })),
            },
          },
          include: { items: true, payments: true },
        });

        // 5. Update stock + create movements (suivi séquentiel du stockBefore si même produit sur plusieurs lignes)
        const runningStockMap = new Map<string, number>();
        for (const p of productList) {
          runningStockMap.set(p.id, Number(p.stockQty));
        }

        for (const item of preparedItems) {
          const stockBefore = runningStockMap.get(item.productId) ?? 0;
          const stockAfter = stockBefore - item.quantity;
          runningStockMap.set(item.productId, stockAfter);

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
        }

        // 6. Update customer debt if CREDIT payment or partial payment
        if (totalDebtToAdd > 0 && resolvedCustomerId) {
          await tx.customer.update({
            where: { id: resolvedCustomerId },
            data: { totalDebt: { increment: totalDebtToAdd } },
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

        // Restitution du stock (suivi séquentiel du stockBefore si même produit sur plusieurs lignes)
        const voidProductIds = [...new Set(sale.items.map((i) => i.productId))];
        const voidProducts = await tx.product.findMany({
          where: { id: { in: voidProductIds } },
          select: { id: true, stockQty: true },
        });
        const runningVoidStock = new Map<string, number>(
          voidProducts.map((p) => [p.id, Number(p.stockQty)]),
        );

        for (const item of sale.items) {
          const stockBefore = runningVoidStock.get(item.productId) ?? 0;
          const qty = Number(item.quantity);
          const stockAfter = stockBefore + qty;
          runningVoidStock.set(item.productId, stockAfter);

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
                stockAfter,
                saleId: sale.id,
                notes: `Annulation vente ${sale.receiptNumber}`,
              },
            }),
          ]);
        }

        // Réduction de la dette client si paiement CREDIT ou reste impayé
        if (sale.customerId) {
          const creditPaymentsSum = sale.payments
            .filter((p) => p.method === PaymentMethod.CREDIT)
            .reduce((sum, p) => sum + Number(p.amount), 0);
          const unpaidBalance = Math.max(0, Number(sale.totalAmount) - Number(sale.paidAmount));
          const debtToReduce = Math.max(creditPaymentsSum, unpaidBalance);

          if (debtToReduce > 0) {
            const customer = await tx.customer.findUnique({
              where: { id: sale.customerId },
              select: { totalDebt: true },
            });
            if (customer) {
              const newDebt = Math.max(0, Number(customer.totalDebt) - debtToReduce);
              await tx.customer.update({
                where: { id: sale.customerId },
                data: { totalDebt: newDebt },
              });
            }
          }
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

        // Vérifier les remboursements déjà effectués sur cette vente pour empêcher un remboursement > 100%
        const previousRefunds = await tx.sale.findMany({
          where: { originalSaleId: saleId, status: 'REFUNDED' },
          include: { items: true },
        });
        const alreadyRefundedByProduct = new Map<string, number>();
        for (const r of previousRefunds) {
          for (const ri of r.items) {
            alreadyRefundedByProduct.set(
              ri.productId,
              (alreadyRefundedByProduct.get(ri.productId) ?? 0) + Number(ri.quantity),
            );
          }
        }

        // Construction des articles à rembourser (total restant ou partiel)
        type RefundLine = {
          productId: string; productName: string; productSku: string | null;
          quantity: number; unitPrice: number; discount: number; totalPrice: number;
        };

        let lines: RefundLine[];

        if (!dto.items || dto.items.length === 0) {
          lines = [];
          for (const item of originalSale.items) {
            const origQty = Number(item.quantity);
            const refundedSoFar = alreadyRefundedByProduct.get(item.productId) ?? 0;
            const remainingQty = Math.max(0, origQty - refundedSoFar);
            if (remainingQty > 0) {
              alreadyRefundedByProduct.set(item.productId, Math.max(0, refundedSoFar - origQty));
              const ratio = remainingQty / origQty;
              lines.push({
                productId:   item.productId,
                productName: item.productName,
                productSku:  item.productSku,
                quantity:    remainingQty,
                unitPrice:   Number(item.unitPrice),
                discount:    Number(item.discount),
                totalPrice:  Number(item.totalPrice) * ratio,
              });
            } else {
              alreadyRefundedByProduct.set(item.productId, Math.max(0, refundedSoFar - origQty));
            }
          }
          if (lines.length === 0) {
            throw new BadRequestException(
              `Cette vente (${originalSale.receiptNumber}) a déjà été intégralement remboursée.`,
            );
          }
        } else {
          // Calculer la quantité totale vendue par produit sur la vente originale
          const totalSoldByProduct = new Map<string, number>();
          for (const item of originalSale.items) {
            totalSoldByProduct.set(
              item.productId,
              (totalSoldByProduct.get(item.productId) ?? 0) + Number(item.quantity),
            );
          }

          lines = [];
          for (const refundItem of dto.items) {
            const orig = originalSale.items.find((i) => i.id === refundItem.saleItemId);
            if (!orig) {
              throw new BadRequestException(
                `Article ${refundItem.saleItemId} non trouvé dans la vente originale`,
              );
            }
            const totalSold = totalSoldByProduct.get(orig.productId) ?? Number(orig.quantity);
            const alreadyRefunded = alreadyRefundedByProduct.get(orig.productId) ?? 0;
            const maxRefundable = Math.max(0, totalSold - alreadyRefunded);

            if (refundItem.quantity > Number(orig.quantity) || refundItem.quantity > maxRefundable) {
              throw new BadRequestException(
                `Quantité à rembourser (${refundItem.quantity}) supérieure à la quantité restante remboursable (${maxRefundable}) pour "${orig.productName}"`,
              );
            }
            alreadyRefundedByProduct.set(orig.productId, alreadyRefunded + refundItem.quantity);

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

        // Restitution du stock si demandée (suivi séquentiel du stockBefore)
        if (dto.returnToStock) {
          const returnIds = [...new Set(lines.map((l) => l.productId))];
          const returnProducts = await tx.product.findMany({
            where: { id: { in: returnIds } },
            select: { id: true, stockQty: true },
          });
          const runningReturnStock = new Map<string, number>(
            returnProducts.map((p) => [p.id, Number(p.stockQty)]),
          );

          for (const l of lines) {
            const stockBefore = runningReturnStock.get(l.productId) ?? 0;
            const stockAfter = stockBefore + l.quantity;
            runningReturnStock.set(l.productId, stockAfter);

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
                  stockAfter,
                  saleId:      refundSale.id,
                  notes:       `Retour produit - Remboursement ${originalSale.receiptNumber}`,
                },
              }),
            ]);
          }
        }

        // Réduction proportionnelle de la dette client si CREDIT
        if (originalSale.customerId && Number(originalSale.totalAmount) > 0) {
          const creditPaymentsSum = originalSale.payments
            .filter((p) => p.method === PaymentMethod.CREDIT)
            .reduce((sum, p) => sum + Number(p.amount), 0);
          const unpaidBalance = Math.max(0, Number(originalSale.totalAmount) - Number(originalSale.paidAmount));
          const origDebt = Math.max(creditPaymentsSum, unpaidBalance);

          if (origDebt > 0) {
            const ratio       = totalAmount / Number(originalSale.totalAmount);
            const debtReduced = origDebt * ratio;
            if (debtReduced > 0) {
              const customer = await tx.customer.findUnique({
                where: { id: originalSale.customerId },
                select: { totalDebt: true },
              });
              if (customer) {
                const newDebt = Math.max(0, Number(customer.totalDebt) - debtReduced);
                await tx.customer.update({
                  where: { id: originalSale.customerId },
                  data:  { totalDebt: newDebt },
                });
              }
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
    const limit = Number(filters.limit ?? 100);
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
