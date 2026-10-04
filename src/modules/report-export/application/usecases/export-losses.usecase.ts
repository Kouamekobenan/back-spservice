import { Injectable } from '@nestjs/common';
import { ExportRepository, LossesReportData } from '../../infrastructure/repository/export.repository.js';
import { PdfGenerator } from '../../infrastructure/generators/pdf.generator.js';
import { ExcelGenerator } from '../../infrastructure/generators/excel.generator.js';
import { ExportQueryDto } from '../dtos/export-query.dto.js';
import type { ExportResult } from './export-sales.usecase.js';

@Injectable()
export class ExportLossesUseCase {
  constructor(
    private readonly repo: ExportRepository,
    private readonly pdf: PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async getData(shopId: string, fromDate?: string, toDate?: string): Promise<LossesReportData> {
    const from = fromDate ? new Date(fromDate) : startOfMonth();
    const to = toDate ? new Date(toDate) : endOfDay(new Date());
    return await this.repo.getLossesReportData(shopId, from, to);
  }

  async execute(query: ExportQueryDto): Promise<ExportResult> {
    const from = query.fromDate ? new Date(query.fromDate) : startOfMonth();
    const to = query.toDate ? new Date(query.toDate) : endOfDay(new Date());

    const data = await this.repo.getLossesReportData(query.shopId, from, to);

    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const dateStr = `${fromStr}_${toStr}`;

    if (query.format === 'pdf') {
      return {
        buffer: await this.pdf.generateLosses(data),
        filename: `rapport-pertes-${dateStr}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: await this.excel.generateLosses(data),
      filename: `rapport-pertes-${dateStr}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(d = new Date()): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
