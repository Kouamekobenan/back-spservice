import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {type IUserRepository } from '../users/application/interfaces/user.interface.repository';
import { User } from '../users/domain/entities/user.entity';
@Injectable()
export class AuthMeUseCase {
  private readonly logger = new Logger(AuthMeUseCase.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
  async execute(userId: string): Promise<User | null> {
    try {
      console.log('user by ID:', userId);
      const user = await this.userRepository.getUserById(userId);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failled to retrieve user to connect:${error instanceof Error ? error.stack : ''}`);
      throw new BadRequestException('Failed to retrieve user', {
        cause: error,
        description: errorMessage,
      });
    }
  }
}
