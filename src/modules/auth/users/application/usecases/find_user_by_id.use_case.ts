import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {type IUserRepository } from '../interfaces/user.interface.repository';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}
  async execute(userId: string): Promise<User | null> {
    if (!userId || typeof userId !== 'string') {
      throw new BadRequestException('ID utilisateur invalide');
    }
    try {
      return await this.userRepository.getUserById(userId);
    } catch (error) {
      // ⚠️ On ne masque pas une NotFoundException venant du repository
      if (error.status === 404) throw error;

      throw new BadRequestException(
        `Erreur lors de la récupération de l'utilisateur : ${error.message}`,
      );
    }
  }
}
