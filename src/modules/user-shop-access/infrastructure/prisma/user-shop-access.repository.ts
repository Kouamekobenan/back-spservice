import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class UserShopAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndShop(userId: string, shopId: string) {
    return this.prisma.userShopAccess.findFirst({ where: { userId, shopId } });
  }

  async create(data: { userId: string; shopId: string; roleInShop?: any }) {
    return this.prisma.userShopAccess.create({ data });
  }

  async update(id: string, data: { roleInShop?: any }) {
    return this.prisma.userShopAccess.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.userShopAccess.delete({ where: { id } });
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
