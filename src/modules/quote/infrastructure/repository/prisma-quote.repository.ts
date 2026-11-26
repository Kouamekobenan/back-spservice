import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  IQuoteRepository,
  QuotePrintContext,
} from '../../domain/interfaces/quote.repository.interface.js';
import { Quote } from '../../domain/entities/quote.entity.js';
import { CreateQuoteDto, QuoteItemDto } from '../../application/dtos/create-quote.dto.js';
import { UpdateQuoteDto } from '../../application/dtos/update-quote.dto.js';
import { FilterQuoteDto } from '../../application/dtos/filter-quote.dto.js';
import { QuoteMapper } from '../../domain/mappers/quote.mapper.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class PrismaQuoteRepository implements IQuoteRepository {
  private readonly logger = new Logger(PrismaQuoteRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: QuoteMapper,
  ) {}

  private get quoteDelegate(): any {
    return (this.prisma as any).quote;
  }

  async generateQuoteNumber(shopId: string): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    const count = await this.quoteDelegate.count({
      where: {
        shopId,
        createdAt: { gte: startOfDay },
      },
    });
    return `DEV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private async resolveItemsFromProducts(
    tx: any,
    items: QuoteItemDto[],
    useWholesalePrice = false,
  ) {
    const requestedProductIds = [...new Set(items.map((i) => i.productId))];
    const productList = await tx.product.findMany({
      where: {
        OR: [
          { id: { in: requestedProductIds } },
          { localId: { in: requestedProductIds } },
        ],
      },
    });

    const productMap = new Map<string, any>();
    for (const p of productList) {
      productMap.set(p.id, p);
      if (p.localId) productMap.set(p.localId, p);
    }

    return items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Produit ${item.productId} non trouvé en boutique`);
      }

      // Si unitPrice n'est pas fourni sur la ligne du devis, on utilise le prix du produit en boutique
      // (prix de gros si useWholesalePrice est activé et défini, sinon sellingPrice).
      // Aucune soustraction ni blocage de stock !
      const defaultPrice =
        useWholesalePrice && product.wholeSalePrice != null
          ? Number(product.wholeSalePrice)
          : Number(product.sellingPrice);

      const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : defaultPrice;
      const quantity = Number(item.quantity);
      const discount = Number(item.discount || 0);
      const totalPrice = Math.max(0, (unitPrice - discount) * quantity);

      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku ?? null,
        quantity,
        unitPrice,
        discount,
        totalPrice,
      };
    });
  }

  async create(data: CreateQuoteDto, quoteNumber: string): Promise<Quote> {
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const preparedItems = await this.resolveItemsFromProducts(
          tx,
          data.items,
          data.useWholesalePrice,
        );

        // Résoudre le client existant si customerId est fourni
        let resolvedCustomerId: string | null = null;
        let customerName = data.customerName ?? null;
        let customerPhone = data.customerPhone ?? null;
        let customerEmail = data.customerEmail ?? null;
        let customerAddress = data.customerAddress ?? null;

        if (data.customerId) {
          const customer = await tx.customer.findFirst({
            where: { OR: [{ id: data.customerId }, { localId: data.customerId }] },
          });
          if (!customer) {
            throw new BadRequestException(`Client ${data.customerId} non trouvé`);
          }
          resolvedCustomerId = customer.id;
          customerName = customerName ?? customer.name;
          customerPhone = customerPhone ?? customer.phone;
          customerEmail = customerEmail ?? customer.email;
          customerAddress = customerAddress ?? customer.address;
        }

        const subtotal = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const discountAmount = Number(data.discountAmount || 0);
        const taxAmount = Number(data.taxAmount || 0);
        const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

        // Validité par défaut : +15 jours si non spécifiée
        const validUntil = data.validUntil
          ? new Date(data.validUntil)
          : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

        const created = await tx.quote.create({
          data: {
            quoteNumber,
            status: 'DRAFT',
            shopId: data.shopId,
            userId: data.userId,
            customerId: resolvedCustomerId,
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            validUntil,
            notes: data.notes ?? null,
            items: {
              create: preparedItems,
            },
          },
          include: { items: true, customer: true },
        });

        return this.mapper.toDomain(created);
      });
    } catch (error) {
      this.logger.error('Erreur lors de la création du devis', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Échec de la création du devis');
    }
  }

  async findById(id: string): Promise<Quote | null> {
    const quote = await this.quoteDelegate.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    return quote ? this.mapper.toDomain(quote) : null;
  }

  async findPrintContextById(id: string): Promise<QuotePrintContext | null> {
    const raw = await this.quoteDelegate.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        shop: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            taxId: true,
            logoUrl: true,
            currency: true,
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (!raw) return null;

    return {
      quote: this.mapper.toDomain(raw),
      shop: {
        name: raw.shop.name,
        address: raw.shop.address ?? null,
        phone: raw.shop.phone ?? null,
        email: raw.shop.email ?? null,
        taxId: raw.shop.taxId ?? null,
        logoUrl: raw.shop.logoUrl ?? null,
        currency: raw.shop.currency ?? 'XOF',
      },
      authorName: raw.user?.name ?? '',
    };
  }

  async findAll(filters: FilterQuoteDto): Promise<PaginatedResponseRepository<Quote>> {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 30);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.customerId) where.customerId = filters.customerId;

    if (filters.search) {
      where.OR = [
        { quoteNumber: { contains: filters.search } },
        { customerName: { contains: filters.search } },
        { customerPhone: { contains: filters.search } },
      ];
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [quotes, total] = await Promise.all([
      this.quoteDelegate.findMany({
        where,
        include: { items: true, customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.quoteDelegate.count({ where }),
    ]);

    return {
      data: quotes.map((q: any) => this.mapper.toDomain(q)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  async update(id: string, data: UpdateQuoteDto): Promise<Quote> {
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const existing = await tx.quote.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!existing) throw new NotFoundException(`Devis ${id} non trouvé`);

        let subtotal = Number(existing.subtotal);
        const discountAmount =
          data.discountAmount != null ? Number(data.discountAmount) : Number(existing.discountAmount);
        const taxAmount =
          data.taxAmount != null ? Number(data.taxAmount) : Number(existing.taxAmount);

        let itemsUpdateOp: any = undefined;
        if (data.items) {
          const preparedItems = await this.resolveItemsFromProducts(
            tx,
            data.items,
            data.useWholesalePrice,
          );
          subtotal = preparedItems.reduce((sum, item) => sum + item.totalPrice, 0);
          itemsUpdateOp = {
            deleteMany: {},
            create: preparedItems,
          };
        }

        const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

        const updated = await tx.quote.update({
          where: { id },
          data: {
            ...(data.status ? { status: data.status } : {}),
            ...(data.customerId !== undefined ? { customerId: data.customerId || null } : {}),
            ...(data.customerName !== undefined ? { customerName: data.customerName } : {}),
            ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone } : {}),
            ...(data.customerEmail !== undefined ? { customerEmail: data.customerEmail } : {}),
            ...(data.customerAddress !== undefined ? { customerAddress: data.customerAddress } : {}),
            ...(data.validUntil !== undefined
              ? { validUntil: data.validUntil ? new Date(data.validUntil) : null }
              : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            ...(itemsUpdateOp ? { items: itemsUpdateOp } : {}),
          },
          include: { items: true, customer: true },
        });

        return this.mapper.toDomain(updated);
      });
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du devis', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Échec de la mise à jour du devis');
    }
  }

  async markAsConverted(id: string, saleId: string): Promise<Quote> {
    const updated = await this.quoteDelegate.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedSaleId: saleId,
      },
      include: { items: true, customer: true },
    });
    return this.mapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.quoteDelegate.delete({ where: { id } });
  }
}
