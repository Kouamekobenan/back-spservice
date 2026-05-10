import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { ShopSetting } from '../../domain/entities/shop-setting.entity.js';
import { IShopSettingRepository } from '../../domain/repositories/shop-setting.repository.interface.js';
import { ShopSettingMapper } from '../../domain/mappers/shop-setting.mapper.js';

@Injectable()
export class ShopSettingRepository implements IShopSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByShopId(shopId: string | null): Promise<ShopSetting[]> {
    const prismaSettings = await this.prisma.shopSetting.findMany({
      where: { shopId },
    });
    return prismaSettings.map(ShopSettingMapper.toDomain);
  }

  async findByKey(shopId: string | null, key: string): Promise<ShopSetting | null> {
    const prismaSetting = await this.prisma.shopSetting.findUnique({
      where: {
        shopId_key: { shopId: shopId!, key },
      },
    });
    return prismaSetting ? ShopSettingMapper.toDomain(prismaSetting) : null;
  }

  async upsert(setting: ShopSetting): Promise<ShopSetting> {
    const data = ShopSettingMapper.toPersistence(setting);
    const prismaSetting = await this.prisma.shopSetting.upsert({
      where: {
        shopId_key: { shopId: data.shopId, key: data.key },
      },
      update: {
        value: data.value,
        group: data.group,
      },
      create: data,
    });
    return ShopSettingMapper.toDomain(prismaSetting);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shopSetting.delete({
      where: { id },
    });
  }
}
