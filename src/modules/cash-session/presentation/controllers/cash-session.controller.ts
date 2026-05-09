import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpenCashSessionUseCase } from '../../application/usecases/open-cash-session.usecase.js';
import { CloseCashSessionUseCase } from '../../application/usecases/close-cash-session.usecase.js';
import { GetActiveCashSessionUseCase } from '../../application/usecases/get-active-cash-session.usecase.js';
import { OpenCashSessionDto } from '../../application/dtos/open-cash-session.dto.js';
import { CloseCashSessionDto } from '../../application/dtos/close-cash-session.dto.js';

@ApiTags('Cash Sessions')
@ApiBearerAuth()
@Controller('cash-sessions')
export class CashSessionController {
  constructor(
    private readonly openUseCase: OpenCashSessionUseCase,
    private readonly closeUseCase: CloseCashSessionUseCase,
    private readonly getActiveUseCase: GetActiveCashSessionUseCase,
  ) {}

  @Post('open')
  @ApiOperation({ summary: 'Ouvrir une nouvelle session de caisse' })
  @ApiResponse({ status: 201, description: 'Session ouverte avec succès.' })
  @ApiResponse({ status: 409, description: 'Une session est déjà active pour cet utilisateur.' })
  async open(@Body() dto: OpenCashSessionDto) {
    return await this.openUseCase.execute(dto);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Fermer une session de caisse active' })
  @ApiResponse({ status: 200, description: 'Session fermée avec succès.' })
  @ApiResponse({ status: 404, description: 'Session non trouvée.' })
  async close(@Param('id') id: string, @Body() dto: CloseCashSessionDto) {
    return await this.closeUseCase.execute(id, dto);
  }

  @Get('active/:userId')
  @ApiOperation({ summary: 'Récupérer la session active d’un utilisateur' })
  @ApiResponse({ status: 200, description: 'Détails de la session active ou null.' })
  async getActive(@Param('userId') userId: string) {
    return await this.getActiveUseCase.execute(userId);
  }
}
