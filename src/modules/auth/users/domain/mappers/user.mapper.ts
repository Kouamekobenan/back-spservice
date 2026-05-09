import { UserDto } from '../../application/dtos/user.dto';
import { User } from '../entities/user.entity';
import { Prisma, User as UserPrisma } from '@prisma/client';
import { UserRole as Role } from '../enums/role.enum';

export class UserMapper {
  toPersitence(data: UserDto): Prisma.UserCreateInput {
    return {
      username: data.username,
      passwordHash: data.passwordHash,
      name: data.name,
      phone:data.phone,
      role: data.role,
      pin:data.pin,
      isActive:data.isActive,
      lastLoginAt:data.lastLoginAt,
      shop:{connect:{id:data.shopId}},
      localId:data.localId
    };
  }

  toAplication(Userdata: any): User {
    return new User(
      Userdata.id,
      Userdata.username,
      Userdata.passwordHash,
      Userdata.refreshToken,
      Userdata.refreshToken,
      Userdata.name ?? '',
      Userdata.phone,
      Userdata.role as Role,
      Userdata.pin,
      Userdata.isActive,
      Userdata.shopId,
      Userdata.localId,
      Userdata.createdAt,
      Userdata.updatedAt,
    );
  }

  toUpdateUser(userData: UserDto): any {
    return {
      name: userData.name,
      // email: userData.email,
      password: userData.passwordHash,
      // phone: userData.phone,
      role: userData.role,
    };
  }
}
