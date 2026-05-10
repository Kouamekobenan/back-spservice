import { Module } from '@nestjs/common';
import { ShopSettingController } from './presentation/controllers/shop-setting.controller.js';
import { ShopSettingRepository } from './infrastructure/repository/shop-setting.repository.js';
import { UpsertShopSettingUseCase } from './application/usecases/upsert-shop-setting.usecase.js';
import { GetShopSettingsUseCase } from './application/usecases/get-shop-settings.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [ShopSettingController],
  providers: [
    PrismaService,
    UpsertShopSettingUseCase,
    GetShopSettingsUseCase,
    {
      provide: 'IShopSettingRepository',
      useClass: ShopSettingRepository,
    },
  ],
  exports: [UpsertShopSettingUseCase, GetShopSettingsUseCase],
})
export class ShopSettingModule {}
