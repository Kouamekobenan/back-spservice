import { UserDto } from '../../application/dtos/user.dto';
import { User } from '../entities/user.entity';
import { Prisma, User as UserPrisma } from '@prisma/client';
import { UserRole as Role } from '../enums/role.enum';


export class UserMapper {
  toPersitence(data: UserDto): Prisma.UserCreateInput {
    return {
      name: data.name,
      email: data.email ?? '',
      password: data.password,
      phone: data.phone,
      role: data.role,
    };
  }

  toAplication(Userdata: any & { totalScans?: number }): User {
    return new User(
      Userdata.id,
      Userdata.name ?? '',
      Userdata.email,
      Userdata.password,
      Userdata.phone,
      Userdata.role as Role,
      Userdata.refreshToken,
      Userdata.createdAt,
      Userdata.updatedAt,
      Userdata._count?.scannedTickets ?? Userdata.totalScans ?? 0, // ✅
    );
  }

  toUpdateUser(userData: UserDto): any {
    return {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      role: userData.role,
    };
  }
}
