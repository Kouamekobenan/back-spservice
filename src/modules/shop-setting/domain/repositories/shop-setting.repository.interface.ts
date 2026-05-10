import { ShopSetting } from '../entities/shop-setting.entity';

export interface IShopSettingRepository {
  findByShopId(shopId: string | null): Promise<ShopSetting[]>;
  findByKey(shopId: string | null, key: string): Promise<ShopSetting | null>;
  upsert(setting: ShopSetting): Promise<ShopSetting>;
  delete(id: string): Promise<void>;
}
