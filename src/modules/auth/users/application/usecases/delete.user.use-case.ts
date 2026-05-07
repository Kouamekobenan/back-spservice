import { Inject, Injectable } from "@nestjs/common";
import { IUserRepository } from "../interfaces/user.interface.repository";

@Injectable()

export class DeleteUserUseCase{
    constructor(@Inject('IUserRepository') private readonly userRepository: IUserRepository){}
    async execute(userId:string): Promise<boolean>{
        try {
            await this.userRepository.deleteUser(userId)
            return true
        } catch (error) {
            console.error('Unable to delete user')
            return false
        }
      }
    }
