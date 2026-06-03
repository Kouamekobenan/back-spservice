import { PaginatedResponseRepository } from '../../../../../common/types/response-respository';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/role.enum';
import { FilterUserDto } from '../dtos/filter-user.dto';
import { UserDto } from '../dtos/user.dto';
export interface IUserRepository {
  createUser(dataUser: UserDto): Promise<User>;
  // findByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;
  getUserById(id: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  paginate(
    page: number,
    limit: number,
    search?: FilterUserDto,
    role?: UserRole | 'ALL',
  ): Promise<{
    data: User[];
    totalPage: number;
    total: number;
    page: number;
    limit: number;
  }>;
  updateRefreshToken(userId: string, refreshToken: string): Promise<User>;
  lastConnect(id: string): Promise<User>;
  // updateDeviceToken(id: string, dto: UpdateDeviceTokenDto): Promise<User>;
  updateUser(id: string, dataUser: UserDto): Promise<User>;
  updatePassword(id: string, password:string): Promise<User>;
  stats(limit:number, page:number):Promise<PaginatedResponseRepository<User>>
}
