import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserShopAccessRepository } from '../../infrastructure/prisma/user-shop-access.repository';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class UserShopAccessService {
  constructor(
    private readonly repo: UserShopAccessRepository,
    private readonly prisma: PrismaService,
  ) {}

  async assignUserToShop(userId: string, shopId: string, roleInShop?: Role) {
    const existing = await this.repo.findByUserAndShop(userId, shopId);
    if (existing) {
      // Si l'accès existe déjà, on met à jour le rôle
      return this.repo.update(existing.id, { roleInShop });
    }
    return this.repo.create({ userId, shopId, roleInShop });
  }

  async updateUserRole(userId: string, shopId: string, roleInShop?: Role) {
    const existing = await this.repo.findByUserAndShop(userId, shopId);
    if (!existing) throw new NotFoundException('Access not found');
    return this.repo.update(existing.id, { roleInShop });
  }

  async removeUserFromShop(userId: string, shopId: string) {
    const existing = await this.repo.findByUserAndShop(userId, shopId);
    if (!existing) throw new NotFoundException('Access not found');
    return this.repo.delete(existing.id);
  }

  async listUsersForShop(shopId: string) {
    return this.repo.findByShop(shopId);
  }

  async listShopsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Le SUPER_ADMIN a accès universel à toutes les boutiques actives
    if (user?.role === Role.SUPER_ADMIN) {
      const allShops = await this.prisma.shop.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      return allShops.map((shop) => ({
        id: `super-${shop.id}`,
        userId,
        shopId: shop.id,
        roleInShop: Role.SUPER_ADMIN,
        assignedAt: shop.createdAt,
        shop,
      }));
    }

    return this.repo.findByUser(userId);
  }
}
