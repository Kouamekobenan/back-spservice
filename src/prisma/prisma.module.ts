import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule], // Nécessaire pour injecter ConfigService dans PrismaService
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}