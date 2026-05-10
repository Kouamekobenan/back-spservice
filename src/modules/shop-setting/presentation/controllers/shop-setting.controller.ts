import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpsertShopSettingUseCase } from '../../application/usecases/upsert-shop-setting.usecase.js';
import { GetShopSettingsUseCase } from '../../application/usecases/get-shop-settings.usecase.js';
import { CreateShopSettingDto, ShopSettingDto } from '../../application/dtos/shop-setting.dto.js';
import { ShopSettingMapper } from '../../domain/mappers/shop-setting.mapper.js';

@ApiTags('Shop Settings')
@Controller('shop-settings')
export class ShopSettingController {
  constructor(
    private readonly upsertUseCase: UpsertShopSettingUseCase,
    private readonly getByShopUseCase: GetShopSettingsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a shop setting' })
  @ApiResponse({ status: 201, type: ShopSettingDto })
  async upsert(@Body() dto: CreateShopSettingDto) {
    const setting = await this.upsertUseCase.execute(dto);
    return ShopSettingMapper.toDto(setting);
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get all settings for a specific shop' })
  @ApiResponse({ status: 200, type: [ShopSettingDto] })
  async getByShop(@Param('shopId') shopId: string) {
    const settings = await this.getByShopUseCase.execute(shopId);
    return settings.map(ShopSettingMapper.toDto);
  }
}
