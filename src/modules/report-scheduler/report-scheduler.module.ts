import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { ReportDataService } from './report-data.service';
import { ReportSchedulerService } from './report-scheduler.service';
import { ReportSubscriptionController } from './report-subscription.controller';
import { ReportController } from './report.controller';

@Module({
  imports: [ScheduleModule.forRoot(), MailModule],
  controllers: [ReportSubscriptionController, ReportController],
  providers: [PrismaService, ReportDataService, ReportSchedulerService],
  exports: [ReportSchedulerService],
})
export class ReportSchedulerModule {}
