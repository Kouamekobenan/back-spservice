import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetDashboardOverviewUseCase, GetShopsPerformanceUseCase, GetCategoriesPerformanceUseCase, GetCashiersPerformanceUseCase, GetSalesTimelineUseCase, GetDashboardAlertsUseCase, GetFinancialReportUseCase } from '../../application/usecases/dashboard-usecase.js';
import { PeriodQueryDto, RankedQueryDto, AlertsQueryDto, OverviewResponseDto, ShopsPerformanceResponseDto, CategoriesPerformanceResponseDto, CashiersPerformanceResponseDto, SalesTimelineResponseDto, AlertsResponseDto, FinancialReportResponseDto } from '../../application/super-Admin.dto.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/role.guard.js';
import { Roles } from '../../../auth/decorators/roles.decorators.js';

@ApiTags('dashboard-super-admin')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('SUPER_ADMIN', 'ADMIN')
@Controller('dashboard-super-admin')
export class DashboardSuperAdminController {
  constructor(
    private readonly getOverviewUseCase: GetDashboardOverviewUseCase,
    private readonly getShopsPerformanceUseCase: GetShopsPerformanceUseCase,
    private readonly getCategoriesPerformanceUseCase: GetCategoriesPerformanceUseCase,
    private readonly getCashiersPerformanceUseCase: GetCashiersPerformanceUseCase,
    private readonly getSalesTimelineUseCase: GetSalesTimelineUseCase,
    private readonly getAlertsUseCase: GetDashboardAlertsUseCase,
    private readonly getFinancialReportUseCase: GetFinancialReportUseCase,
  ) {}
  // @Public()
  @Get('overview')
  @ApiOperation({ summary: 'KPIs globaux et vue d\'ensemble du tableau de bord' })
  @ApiResponse({ status: HttpStatus.OK, type: OverviewResponseDto })
  async getOverview(@Query() query: PeriodQueryDto): Promise<OverviewResponseDto> {
    return this.getOverviewUseCase.execute(query);
  }

  @Get('shops')
  @ApiOperation({ summary: 'Classement et performance des boutiques actives' })
  @ApiResponse({ status: HttpStatus.OK, type: ShopsPerformanceResponseDto })
  async getShopsPerformance(@Query() query: RankedQueryDto): Promise<ShopsPerformanceResponseDto> {
    return this.getShopsPerformanceUseCase.execute(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Performance des ventes par catégorie de produits' })
  @ApiResponse({ status: HttpStatus.OK, type: CategoriesPerformanceResponseDto })
  async getCategoriesPerformance(
    @Query() query: PeriodQueryDto & { shopId?: string },
  ): Promise<CategoriesPerformanceResponseDto> {
    return this.getCategoriesPerformanceUseCase.execute(query);
  }

  @Get('cashiers')
  @ApiOperation({ summary: 'Classement et performance des caissiers / gérants' })
  @ApiResponse({ status: HttpStatus.OK, type: CashiersPerformanceResponseDto })
  async getCashiersPerformance(
    @Query() query: RankedQueryDto & { shopId?: string },
  ): Promise<CashiersPerformanceResponseDto> {
    return this.getCashiersPerformanceUseCase.execute(query);
  }

  @Get('sales-timeline')
  @ApiOperation({ summary: 'Série temporelle des ventes pour graphiques d\'évolution' })
  @ApiResponse({ status: HttpStatus.OK, type: SalesTimelineResponseDto })
  async getSalesTimeline(@Query() query: PeriodQueryDto): Promise<SalesTimelineResponseDto> {
    return this.getSalesTimelineUseCase.execute(query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes opérationnelles (stocks bas, écarts caisse, etc.)' })
  @ApiResponse({ status: HttpStatus.OK, type: AlertsResponseDto })
  async getAlerts(@Query() query: AlertsQueryDto): Promise<AlertsResponseDto> {
    return this.getAlertsUseCase.execute(query);
  }

  @Get('financial-report')
  @ApiOperation({ summary: 'Rapport financier P&L (Pertes et Profits) consolidé' })
  @ApiResponse({ status: HttpStatus.OK, type: FinancialReportResponseDto })
  async getFinancialReport(@Query() query: PeriodQueryDto): Promise<FinancialReportResponseDto> {
    return this.getFinancialReportUseCase.execute(query);
  }
}
