import { Inject } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.interface.repository';

export class FindUserByPhoneUsecase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,
  ) {}
  async execute(phone: string) {
    return await this.userRepo.findByPhone(phone);
  }
}
