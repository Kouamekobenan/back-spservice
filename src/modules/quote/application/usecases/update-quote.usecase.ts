import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { UpdateQuoteDto } from '../dtos/update-quote.dto.js';
import { Quote } from '../../domain/entities/quote.entity.js';

@Injectable()
export class UpdateQuoteUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(id: string, data: UpdateQuoteDto): Promise<Quote> {
    const existing = await this.quoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Devis ${id} non trouvé`);
    }

    if (existing.getStatus() === 'CONVERTED') {
      throw new BadRequestException('Ce devis a déjà été converti en vente et ne peut plus être modifié.');
    }

    if (data.items && data.items.length === 0) {
      throw new BadRequestException('Le devis doit contenir au moins un article.');
    }

    return this.quoteRepository.update(id, data);
  }
}
