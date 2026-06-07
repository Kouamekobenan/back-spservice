import { Module } from '@nestjs/common';
import { ReportExportController } from './presentation/controllers/report-export.controller.js';
import { ExportSalesUseCase, ExportFinancialUseCase, ExportStockUseCase, ExportDebtsUseCase } from './application/usecases/export-sales.usecase.js';
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
  ],
})
export class ReportExportModule {}
