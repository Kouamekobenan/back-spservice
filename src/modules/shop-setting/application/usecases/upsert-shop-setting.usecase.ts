import { Inject, Injectable } from '@nestjs/common';
import type { IShopSettingRepository } from '../../domain/repositories/shop-setting.repository.interface.js';
import { ShopSetting } from '../../domain/entities/shop-setting.entity.js';
import { CreateShopSettingDto } from '../dtos/shop-setting.dto.js';
import { randomUUID as uuidv4 } from 'crypto';


@Injectable()
export class UpsertShopSettingUseCase {
  constructor(
    @Inject('IShopSettingRepository')
    private readonly repository: IShopSettingRepository,
  ) {}

  async execute(dto: CreateShopSettingDto): Promise<ShopSetting> {
    const existing = await this.repository.findByKey(dto.shopId, dto.key);

    if (existing) {
      existing.updateValue(dto.value);
      return this.repository.upsert(existing);
    }

    const newSetting = new ShopSetting(
      uuidv4(),
      dto.shopId,
      dto.key,
      dto.value,
      dto.group || 'general',
    );

    return this.repository.upsert(newSetting);
  }
}
