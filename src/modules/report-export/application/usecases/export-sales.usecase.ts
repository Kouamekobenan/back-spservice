import { Injectable } from '@nestjs/common';
import { ExportRepository } from '../../infrastructure/repository/export.repository.js';
import { PdfGenerator }     from '../../infrastructure/generators/pdf.generator.js';
import { ExcelGenerator }   from '../../infrastructure/generators/excel.generator.js';
import { ExportQueryDto }   from '../dtos/export-query.dto.js';

export interface ExportResult {
  buffer:      Buffer;
  filename:    string;
  contentType: string;
}

@Injectable()
export class ExportSalesUseCase {
  constructor(
    private readonly repo:  ExportRepository,
    private readonly pdf:   PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async execute(query: ExportQueryDto): Promise<ExportResult> {
    const from = query.fromDate ? new Date(query.fromDate) : startOfDay(new Date());
    const to   = query.toDate   ? new Date(query.toDate)   : endOfDay(new Date());

    const data = await this.repo.getSalesReportData(query.shopId, from, to, query.userId);

    const dateStr = toDateStr(from, to);
    if (query.format === 'pdf') {
      return {
        buffer:      await this.pdf.generateSales(data),
        filename:    `rapport-ventes-${dateStr}.pdf`,
        contentType: 'application/pdf',
      };
    }
    return {
      buffer:      await this.excel.generateSales(data),
      filename:    `rapport-ventes-${dateStr}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

@Injectable()
export class ExportFinancialUseCase {
  constructor(
    private readonly repo:  ExportRepository,
    private readonly pdf:   PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async execute(query: ExportQueryDto): Promise<ExportResult> {
    const from = query.fromDate ? new Date(query.fromDate) : startOfMonth();
    const to   = query.toDate   ? new Date(query.toDate)   : endOfDay(new Date());

    const data = await this.repo.getFinancialReportData(query.shopId, from, to);

    const dateStr = toDateStr(from, to);
    if (query.format === 'pdf') {
      return {
        buffer:      await this.pdf.generateFinancial(data),
        filename:    `rapport-financier-${dateStr}.pdf`,
        contentType: 'application/pdf',
      };
    }
    return {
      buffer:      await this.excel.generateFinancial(data),
      filename:    `rapport-financier-${dateStr}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

@Injectable()
export class ExportStockUseCase {
  constructor(
    private readonly repo:  ExportRepository,
    private readonly pdf:   PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async execute(query: import('../dtos/export-query.dto.js').StockExportQueryDto): Promise<ExportResult> {
    const data = await this.repo.getStockReportData(query.shopId, query.categoryId, query.stockFilter);

    const suffix = query.stockFilter && query.stockFilter !== 'all' ? `-${query.stockFilter}` : '';
    if (query.format === 'pdf') {
      return {
        buffer:      await this.pdf.generateStock(data),
        filename:    `rapport-stock${suffix}-${todayStr()}.pdf`,
        contentType: 'application/pdf',
      };
    }
    return {
      buffer:      await this.excel.generateStock(data),
      filename:    `rapport-stock${suffix}-${todayStr()}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

@Injectable()
export class ExportDebtsUseCase {
  constructor(
    private readonly repo:  ExportRepository,
    private readonly pdf:   PdfGenerator,
    private readonly excel: ExcelGenerator,
  ) {}

  async execute(query: Pick<ExportQueryDto, 'shopId' | 'format'>): Promise<ExportResult> {
    const data = await this.repo.getDebtsReportData(query.shopId);

    if (query.format === 'pdf') {
      return {
        buffer:      await this.pdf.generateDebts(data),
        filename:    `rapport-creances-${todayStr()}.pdf`,
        contentType: 'application/pdf',
      };
    }
    return {
      buffer:      await this.excel.generateDebts(data),
      filename:    `rapport-creances-${todayStr()}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

// ── Helpers date ─────────────────────────────────────────────────────────────

function startOfDay(d = new Date()): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function endOfDay(d = new Date()): Date {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
}
function startOfMonth(): Date {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function toDateStr(from: Date, to: Date): string {
  return `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`;
}
