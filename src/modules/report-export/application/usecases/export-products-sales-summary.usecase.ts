import { Injectable } from '@nestjs/common';
import { PdfGenerator } from '../../infrastructure/generators/pdf.generator.js';
import { ExcelGenerator } from '../../infrastructure/generators/excel.generator.js';
import { ProductsSummaryExportQueryDto } from '../dtos/products-summary-query.dto.js';
import { GetProductsSalesSummaryUseCase } from './get-products-sales-summary.usecase.js';
import type { ExportResult } from './export-sales.usecase.js';

@Injectable()
export class ExportProductsSalesSummaryUseCase {
  constructor(
    private readonly getSummaryUseCase: GetProductsSalesSummaryUseCase,
    private readonly pdf: PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async execute(query: ProductsSummaryExportQueryDto): Promise<ExportResult> {
    // Récupérer toutes les données sans pagination pour l'export (max 10 000 articles)
    const data = await this.getSummaryUseCase.execute({
      shopId: query.shopId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      categoryId: query.categoryId,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: 1,
      limit: 10000,
    });

    const fromDate = new Date(data.period.from).toISOString().slice(0, 10);
    const toDate = new Date(data.period.to).toISOString().slice(0, 10);
    const dateStr = `${fromDate}_${toDate}`;

    if (query.format === 'pdf') {
      return {
        buffer: await this.pdf.generateProductsSalesSummary(data),
        filename: `recapitulatif-ventes-produits-${dateStr}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: await this.excel.generateProductsSalesSummary(data),
      filename: `recapitulatif-ventes-produits-${dateStr}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
