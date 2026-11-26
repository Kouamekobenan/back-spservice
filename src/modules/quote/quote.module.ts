import { Module } from '@nestjs/common';
import { QuoteController } from './presentation/controllers/quote.controller.js';
import { CreateQuoteUseCase } from './application/usecases/create-quote.usecase.js';
import { FindAllQuotesUseCase } from './application/usecases/find-all-quotes.usecase.js';
import { FindQuoteByIdUseCase } from './application/usecases/find-quote-by-id.usecase.js';
import { UpdateQuoteUseCase } from './application/usecases/update-quote.usecase.js';
import { DeleteQuoteUseCase } from './application/usecases/delete-quote.usecase.js';
import { ConvertQuoteToSaleUseCase } from './application/usecases/convert-quote-to-sale.usecase.js';
import { GenerateQuotePdfUseCase } from './application/usecases/generate-quote-pdf.usecase.js';
import { PrismaQuoteRepository } from './infrastructure/repository/prisma-quote.repository.js';
import { QuotePdfGenerator } from './infrastructure/generators/quote-pdf.generator.js';
import { QuoteMapper } from './domain/mappers/quote.mapper.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SaleModule } from '../sale/sale.module.js';

@Module({
  imports: [SaleModule],
  controllers: [QuoteController],
  providers: [
    PrismaService,
    QuoteMapper,
    QuotePdfGenerator,
    CreateQuoteUseCase,
    FindAllQuotesUseCase,
    FindQuoteByIdUseCase,
    UpdateQuoteUseCase,
    DeleteQuoteUseCase,
    ConvertQuoteToSaleUseCase,
    GenerateQuotePdfUseCase,
    {
      provide: 'IQuoteRepository',
      useClass: PrismaQuoteRepository,
    },
  ],
  exports: [
    CreateQuoteUseCase,
    FindAllQuotesUseCase,
    FindQuoteByIdUseCase,
    UpdateQuoteUseCase,
    DeleteQuoteUseCase,
    ConvertQuoteToSaleUseCase,
    GenerateQuotePdfUseCase,
  ],
})
export class QuoteModule {}
