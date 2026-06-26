import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportDataService } from './report-data.service';

@ApiTags('Dashboard Rapports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportData: ReportDataService) {}

  @Get('daily/:shopId')
  @ApiOperation({
    summary: 'Rapport journalier (dashboard)',
    description: 'Retourne CA, marge, bénéfice, top produits et stock bas pour un jour donné.',
  })
  @ApiParam({ name: 'shopId' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-23', description: 'YYYY-MM-DD (défaut: aujourd\'hui)' })
  async getDailyReport(
    @Param('shopId') shopId: string,
    @Query('date') date?: string,
  ) {
    const forDate = date ? new Date(date) : undefined;
    return this.reportData.getDailyReport(shopId, forDate);
  }

  @Get('weekly/:shopId')
  @ApiOperation({
    summary: 'Rapport hebdomadaire (dashboard)',
    description: 'Retourne les chiffres de la semaine courante + comparaison semaine précédente.',
  })
  @ApiParam({ name: 'shopId' })
  async getWeeklyReport(@Param('shopId') shopId: string) {
    return this.reportData.getWeeklyReport(shopId);
  }

  @Get('monthly/:shopId')
  @ApiOperation({
    summary: 'Rapport mensuel (dashboard)',
    description: 'Retourne les chiffres du mois + comparaison mois précédent. Paramètres optionnels : month (1-12) et year.',
  })
  @ApiParam({ name: 'shopId' })
  @ApiQuery({ name: 'month', required: false, example: 6, description: 'Mois (1-12, défaut: mois courant)' })
  @ApiQuery({ name: 'year', required: false, example: 2026, description: 'Année (défaut: année courante)' })
  async getMonthlyReport(
    @Param('shopId') shopId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.reportData.getMonthlyReport(shopId, m, y);
  }

  @Get('summary/:shopId')
  @ApiOperation({
    summary: 'Résumé global (dashboard home)',
    description:
      'Chiffres clés du jour en un seul appel — idéal pour la page d\'accueil du dashboard. ' +
      'Pour les alertes stock détaillées, utiliser GET /inventory-dashboard/alerts/:shopId.',
  })
  @ApiParam({ name: 'shopId' })
  async getSummary(@Param('shopId') shopId: string) {
    const daily = await this.reportData.getDailyReport(shopId);

    return {
      today: {
        revenue: daily.totalRevenue,
        sales: daily.totalSales,
        grossMargin: daily.grossMargin,
        grossMarginPct: daily.grossMarginPct,
        netRevenue: daily.netRevenue,
        expenses: daily.totalExpenses,
      },
      topProducts: daily.topProducts.slice(0, 3),
      paymentBreakdown: daily.paymentBreakdown,
      // Compteur rapide — détail complet via GET /inventory-dashboard/alerts/:shopId
      lowStockAlert: {
        count: daily.lowStockProducts.length,
        critical: daily.lowStockProducts.filter((p) => p.stock === 0).length,
      },
    };
  }
}
