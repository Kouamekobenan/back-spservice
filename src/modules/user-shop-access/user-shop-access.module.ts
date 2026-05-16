import { Module } from '@nestjs/common';
import { UserShopAccessController } from './presentation/user-shop-access.controller';
import { UserShopAccessService } from './application/services/user-shop-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserShopAccessRepository } from './infrastructure/prisma/user-shop-access.repository';

@Module({
  imports: [],
  controllers: [UserShopAccessController],
  providers: [UserShopAccessService, UserShopAccessRepository, PrismaService],
  exports: [UserShopAccessService],
})
export class UserShopAccessModule {}
