import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { CreateQuoteDto } from '../dtos/create-quote.dto.js';
import { Quote } from '../../domain/entities/quote.entity.js';

@Injectable()
export class CreateQuoteUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(data: CreateQuoteDto): Promise<Quote> {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Le devis doit contenir au moins un article.');
    }

    const quoteNumber = await this.quoteRepository.generateQuoteNumber(data.shopId);
    return this.quoteRepository.create(data, quoteNumber);
  }
}
