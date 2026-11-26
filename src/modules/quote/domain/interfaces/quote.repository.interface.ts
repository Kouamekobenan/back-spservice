import { Quote } from '../entities/quote.entity.js';
import { CreateQuoteDto } from '../../application/dtos/create-quote.dto.js';
import { UpdateQuoteDto } from '../../application/dtos/update-quote.dto.js';
import { FilterQuoteDto } from '../../application/dtos/filter-quote.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface QuotePrintContext {
  quote: Quote;
  shop: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    taxId: string | null;
    logoUrl: string | null;
    currency: string;
  };
  authorName: string;
}

export interface IQuoteRepository {
  generateQuoteNumber(shopId: string): Promise<string>;
  create(data: CreateQuoteDto, quoteNumber: string): Promise<Quote>;
  findById(id: string): Promise<Quote | null>;
  findPrintContextById(id: string): Promise<QuotePrintContext | null>;
  findAll(filters: FilterQuoteDto): Promise<PaginatedResponseRepository<Quote>>;
  update(id: string, data: UpdateQuoteDto): Promise<Quote>;
  markAsConverted(id: string, saleId: string): Promise<Quote>;
  delete(id: string): Promise<void>;
}
