import { Module } from '@nestjs/common';
import { ReportExportController } from './presentation/controllers/report-export.controller.js';
import { ExportSalesUseCase, ExportFinancialUseCase, ExportStockUseCase, ExportDebtsUseCase } from './application/usecases/export-sales.usecase.js';
import { GetProductsSalesSummaryUseCase } from './application/usecases/get-products-sales-summary.usecase.js';
import { ExportProductsSalesSummaryUseCase } from './application/usecases/export-products-sales-summary.usecase.js';
import { ExportLossesUseCase } from './application/usecases/export-losses.usecase.js';
import { ExportRepository }  from './infrastructure/repository/export.repository.js';
import { PdfGenerator }      from './infrastructure/generators/pdf.generator.js';
import { ExcelGenerator }    from './infrastructure/generators/excel.generator.js';
import { PrismaService }     from '../../prisma/prisma.service.js';

@Module({
  controllers: [ReportExportController],
  providers: [
    PrismaService,
    ExportRepository,
    PdfGenerator,
    ExcelGenerator,
    ExportSalesUseCase,
    ExportFinancialUseCase,
    ExportStockUseCase,
    ExportDebtsUseCase,
    GetProductsSalesSummaryUseCase,
    ExportProductsSalesSummaryUseCase,
    ExportLossesUseCase,
  ],
})
export class ReportExportModule {}
