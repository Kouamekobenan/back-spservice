import { Injectable } from '@nestjs/common';
import { Shop } from '../entities/shop-entity.entity.js';
import { CreateShopDto } from '../../application/dtos/create-shop-dto.dto.js';
import { UpdateShopDto } from '../../application/dtos/update-shop.dto.js';
import { Prisma, Shop as ShopPrisma } from '@prisma/client';

@Injectable()
export class ShopMapper {
  toPersistence(data: CreateShopDto): Prisma.ShopCreateInput {
    return {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      taxId: data.taxId,
      logoUrl: data.logoUrl,
      currency: data.currency ?? 'XOF',
    };
  }

  toApplication(shopData: any): Shop {
    return new Shop(
      shopData.id,
      shopData.name,
      shopData.address,
      shopData.phone,
      shopData.email,
      shopData.taxId,
      shopData.logoUrl,
      shopData.currency,
      shopData.isActive,
      shopData.createdAt,
      shopData.updatedAt,
    );
  }

  toUpdatePersistence(data: UpdateShopDto): Prisma.ShopUpdateInput {
    const updateData: Prisma.ShopUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return updateData;
  }
}
