import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserAccessCache } from '../../../auth/strategies/user-access.cache';

@Injectable()
export class UserShopAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndShop(userId: string, shopId: string) {
    return this.prisma.userShopAccess.findFirst({ where: { userId, shopId } });
  }

  async create(data: { userId: string; shopId: string; roleInShop?: any }) {
    const access = await this.prisma.userShopAccess.create({ data });
    UserAccessCache.invalidate(data.userId);
    return access;
  }

  async update(id: string, data: { roleInShop?: any }) {
    const access = await this.prisma.userShopAccess.update({ where: { id }, data });
    UserAccessCache.invalidate(access.userId);
    return access;
  }

  async delete(id: string) {
    const access = await this.prisma.userShopAccess.delete({ where: { id } });
    UserAccessCache.invalidate(access.userId);
    return access;
  }

  async findByShop(shopId: string) {
    return this.prisma.userShopAccess.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.userShopAccess.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            currency: true,
            logoUrl: true,
            isActive: true,
            shopType: true,
            shopTypeLabel: true,
            createdAt: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
