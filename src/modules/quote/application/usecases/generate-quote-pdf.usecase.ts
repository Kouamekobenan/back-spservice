import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { QuotePdfGenerator } from '../../infrastructure/generators/quote-pdf.generator.js';

@Injectable()
export class GenerateQuotePdfUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
    private readonly pdfGenerator: QuotePdfGenerator,
  ) {}

  async execute(quoteId: string): Promise<{ buffer: Buffer; filename: string }> {
    const context = await this.quoteRepository.findPrintContextById(quoteId);
    if (!context) {
      throw new NotFoundException(`Devis ${quoteId} non trouvé`);
    }

    const buffer = await this.pdfGenerator.generate(context);
    const filename = `${context.quote.getQuoteNumber()}.pdf`;
    return { buffer, filename };
  }
}
