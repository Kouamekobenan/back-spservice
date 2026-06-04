import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GetCashierOverviewUseCase } from '../../application/use-cases/get-cashier-overview.use-case.js';
import {
  CashierOverviewQueryDto,
  CashierOverviewResponseDto,
} from '../../application/dtos/cashier-dashboard.dto.js';
@ApiTags('Cashier Dashboard')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('cashier-dashboard')
export class CashierDashboardController {
  constructor(private readonly getOverviewUseCase: GetCashierOverviewUseCase) {}
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dashboard journalier d'un caissier",
    description:
      'Retourne tous les KPIs de la journée : CA, transactions, ' +
      'répartition des paiements, timeline par heure et dernières ventes.',
  })
  @ApiQuery({ name: 'userId', required: true, description: 'UUID du caissier' })
  @ApiQuery({
    name: 'shopId',
    required: true,
    description: 'UUID de la boutique',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Date YYYY-MM-DD (défaut: aujourd'hui)",
    example: '2026-06-04',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retourné',
    type: CashierOverviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Caissier introuvable' })
  async getOverview(
    @Query() query: CashierOverviewQueryDto,
  ): Promise<CashierOverviewResponseDto> {
    return this.getOverviewUseCase.execute(query);
  }
}
