import { Inject, Injectable } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { Quote } from '../../domain/entities/quote.entity.js';

@Injectable()
export class FindQuoteByIdUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(id: string): Promise<Quote | null> {
    return this.quoteRepository.findById(id);
  }
}
