import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.interface.repository';
import { User } from '../../domain/entities/user.entity';
import { PaginatedResponseRepository } from '../../../../../common/types/response-respository';

@Injectable()
export class ControllerStatasUseCase {
  private readonly logger = new Logger(ControllerStatasUseCase.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
  async execute(
    limit: number,
    page: number,
  ): Promise<PaginatedResponseRepository<User>> {
    try {
      const controllers = await this.userRepository.stats(limit, page);
      this.logger.log(`Controller ${limit} : page:${page}`);
      return controllers;
    } catch (error) {
      this.logger.error('Error during retrieve user');
      throw Error;
    }
  }
}
