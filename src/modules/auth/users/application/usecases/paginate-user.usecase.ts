import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.interface.repository';
import { FilterUserDto } from '../dtos/filter-user.dto';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable()
export class PaginateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    page: number,
    limit: number,
    search?: FilterUserDto,
    role?: UserRole | 'ALL',
  ) {
    try {
      return await this.userRepository.paginate(
        page,
        limit,
        search,
        role,
      );
    } catch (error) {
      throw new BadRequestException('Failed to paginate user', {
        cause: error,
        description: error.message,
      });
    }
  }
}
