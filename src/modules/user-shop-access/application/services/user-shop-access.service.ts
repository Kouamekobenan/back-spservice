import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserShopAccessRepository } from '../../infrastructure/prisma/user-shop-access.repository';
import { Role } from '@prisma/client';

@Injectable()
export class UserShopAccessService {
  constructor(private readonly repo: UserShopAccessRepository) {}

  async assignUserToShop(userId: string, shopId: string, roleInShop?: Role) {
    const existing = await this.repo.findByUserAndShop(userId, shopId);
    if (existing)
      throw new ConflictException('User already assigned to this shop');
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
    return this.repo.findByUser(userId);
  }
}
