import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportSchedulerService } from './report-scheduler.service';

enum ReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  LOW_STOCK = 'LOW_STOCK',
}

class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-shop-id' })
  @IsString() shopId!: string;

  @ApiProperty({ example: 'admin@boutique.com' })
  @IsEmail() email!: string;

  @ApiProperty({ enum: ReportType, example: ReportType.DAILY })
  @IsEnum(ReportType) reportType!: ReportType;
}

class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'admin@boutique.com' })
  @IsOptional() @IsEmail() email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('Rapports Automatiques')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('report-subscriptions')
export class ReportSubscriptionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: ReportSchedulerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un abonnement rapport (admin choisit quoi recevoir)' })
  @ApiBody({ type: CreateSubscriptionDto })
  async create(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    return this.prisma.reportSubscription.upsert({
      where: { shopId_userId_reportType: { shopId: dto.shopId, userId: req.user.userId, reportType: dto.reportType } },
      create: { shopId: dto.shopId, userId: req.user.userId, email: dto.email, reportType: dto.reportType, isActive: true },
      update: { email: dto.email, isActive: true },
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Lister mes abonnements actifs' })
  async findMine(@Req() req: any) {
    return this.prisma.reportSubscription.findMany({
      where: { userId: req.user.userId },
      include: { shop: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Lister les abonnements d\'une boutique' })
  @ApiParam({ name: 'shopId' })
  async findByShop(@Param('shopId') shopId: string) {
    return this.prisma.reportSubscription.findMany({
      where: { shopId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { reportType: 'asc' },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un abonnement (email ou activer/désactiver)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateSubscriptionDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.prisma.reportSubscription.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un abonnement' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    await this.prisma.reportSubscription.delete({ where: { id } });
    return { message: 'Abonnement supprimé.' };
  }

  @Post(':id/send-now')
  @ApiOperation({ summary: 'Envoyer immédiatement le rapport (test / re-send)' })
  @ApiParam({ name: 'id', description: 'ID de l\'abonnement' })
  async sendNow(@Param('id') id: string) {
    await this.scheduler.sendReportNow(id);
    return { message: 'Rapport envoyé avec succès.' };
  }
}
