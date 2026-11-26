import { Inject, Injectable } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';
import { FilterQuoteDto } from '../dtos/filter-quote.dto.js';
import { PaginatedQuoteResponseDto, toQuoteResponseDto } from '../dtos/quote-response.dto.js';

@Injectable()
export class FindAllQuotesUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(filters: FilterQuoteDto): Promise<PaginatedQuoteResponseDto> {
    const result = await this.quoteRepository.findAll(filters);
    return {
      data: result.data.map(toQuoteResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
