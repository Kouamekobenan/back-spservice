import { UserDto } from '../../application/dtos/user.dto.js';
import { User, UserShopAccess } from '../entities/user.entity.js';
import { Prisma, User as UserPrisma, UserShopAccess as PrismaShopAccess } from '@prisma/client';
import { UserRole as Role } from '../enums/role.enum.js';

export class UserMapper {
  toPersistence(data: UserDto): Prisma.UserCreateInput {
    return {
      id: data.id,
      username: data.username,
      passwordHash: data.passwordHash,
      name: data.name,
      phone: data.phone,
      role: data.role,
      pin: data.pin,
      isActive: data.isActive,
      // lastLoginAt: data.lastLoginAt,
      localId: data.localId
    };
  }

  toApplication(userData: any): User {
    const shopAccesses = (userData.shopAccesses || []).map(
      (access: any) => new UserShopAccess(access.shopId, access.roleInShop as Role)
    );

    return new User(
      userData.id,
      userData.username,
      userData.passwordHash,
      userData.refreshToken,
      userData.name,
      userData.phone,
      userData.role as Role,
      userData.pin,
      userData.isActive,
      userData.lastLoginAt,
      shopAccesses,
      userData.localId,
      userData.createdAt,
      userData.updatedAt,
    );
  }

  toUpdateUser(userData: UserDto): any {
    return {
      name: userData.name,
      passwordHash: userData.passwordHash,
      role: userData.role,
      phone: userData.phone,
      isActive: userData.isActive,
    };
  }
}
