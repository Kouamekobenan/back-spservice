import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { ConvertQuoteToSaleDto } from '../dtos/convert-quote-to-sale.dto.js';
import { CreateSaleUseCase } from '../../../sale/application/usecases/create-sale.usecase.js';
import { Sale } from '../../../sale/domain/entities/sale.entity.js';
import { Quote } from '../../domain/entities/quote.entity.js';

@Injectable()
export class ConvertQuoteToSaleUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
    private readonly createSaleUseCase: CreateSaleUseCase,
  ) {}

  async execute(quoteId: string, dto: ConvertQuoteToSaleDto): Promise<{ quote: Quote; sale: Sale }> {
    const quote = await this.quoteRepository.findById(quoteId);
    if (!quote) {
      throw new NotFoundException(`Devis ${quoteId} non trouvé`);
    }

    if (quote.getStatus() === 'CONVERTED') {
      throw new BadRequestException(
        `Ce devis (${quote.getQuoteNumber()}) a déjà été converti en vente.`,
      );
    }

    if (quote.getStatus() === 'REJECTED') {
      throw new BadRequestException(
        `Impossible de convertir un devis rejeté (${quote.getQuoteNumber()}).`,
      );
    }

    // Créer la vente réelle (c'est seulement maintenant que le stock est décrémenté et la caisse impactée)
    const sale = await this.createSaleUseCase.execute({
      shopId: quote.getShopId(),
      userId: dto.userId ?? quote.getUserId(),
      customerId: quote.getCustomerId() ?? undefined,
      cashSessionId: dto.cashSessionId,
      discountAmount: quote.getDiscountAmount(),
      taxAmount: quote.getTaxAmount(),
      notes: dto.notes
        ? `Issu du devis ${quote.getQuoteNumber()} | ${dto.notes}`
        : `Issu du devis ${quote.getQuoteNumber()}`,
      items: quote.getItems().map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
      })),
      payments: dto.payments,
    });

    const updatedQuote = await this.quoteRepository.markAsConverted(quoteId, sale.getId());
    return { quote: updatedQuote, sale };
  }
}
