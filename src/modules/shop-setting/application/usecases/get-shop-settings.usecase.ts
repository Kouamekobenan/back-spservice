import { Inject, Injectable } from '@nestjs/common';
import type { IShopSettingRepository } from '../../domain/repositories/shop-setting.repository.interface.js';
import { ShopSetting } from '../../domain/entities/shop-setting.entity.js';

@Injectable()
export class GetShopSettingsUseCase {
  constructor(
    @Inject('IShopSettingRepository')
    private readonly repository: IShopSettingRepository,
  ) {}

  async execute(shopId: string | null): Promise<ShopSetting[]> {
    return this.repository.findByShopId(shopId);
  }
}
