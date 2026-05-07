import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../interfaces/user.interface.repository';

@Injectable()
export class FindAllUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<User[]> {
    try {
      return this.userRepository.getAllUsers();
    } catch (error) {
      console.error('une Unable');
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}
