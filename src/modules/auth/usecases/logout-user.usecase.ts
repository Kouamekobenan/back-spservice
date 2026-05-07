import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../users/application/interfaces/user.interface.repository';

@Injectable()
export class LogoutUserUseCase {
  private readonly logger = new Logger(LogoutUserUseCase.name);
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
  async execute(userId: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.getUserById(userId);
      if (!user) {
        throw new NotFoundException(`User does not exist!`);
      }
      return { message: 'User deconnected succesfuly 🎉' };
    } catch (error) {
      this.logger.error(`Failled to deconnecte user by ID:${userId}`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failled to deconnecte user by ', {
        cause: error,
        description: errorMessage,
      });
    }
  }
}
