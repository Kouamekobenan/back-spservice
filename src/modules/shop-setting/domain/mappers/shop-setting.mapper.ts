import { ShopSetting } from '../entities/shop-setting.entity.js';
import { ShopSetting as PrismaShopSetting } from '@prisma/client';
import { ShopSettingDto } from '../../application/dtos/shop-setting.dto.js';

export class ShopSettingMapper {
  static toDomain(prismaSetting: PrismaShopSetting): ShopSetting {
    return new ShopSetting(
      prismaSetting.id,
      prismaSetting.shopId,
      prismaSetting.key,
      prismaSetting.value,
      prismaSetting.group,
    );
  }

  static toPersistence(domainSetting: ShopSetting): any {
    return {
      id: domainSetting.getId(),
      shopId: domainSetting.getShopId(),
      key: domainSetting.getKey(),
      value: domainSetting.getValue(),
      group: domainSetting.getGroup(),
    };
  }

  static toDto(domainSetting: ShopSetting): ShopSettingDto {
    return {
      id: domainSetting.getId(),
      shopId: domainSetting.getShopId(),
      key: domainSetting.getKey(),
      value: domainSetting.getValue(),
      group: domainSetting.getGroup(),
    };
  }
}
