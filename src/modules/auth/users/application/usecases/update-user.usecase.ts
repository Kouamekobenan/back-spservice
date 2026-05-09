import { Inject, Injectable, Logger } from "@nestjs/common";

import { UserDto } from "../dtos/user.dto";
import { User } from "../../domain/entities/user.entity";
import { AuthService } from "../../../services/auth.service";
import {type IUserRepository } from "../interfaces/user.interface.repository";
@Injectable()
export class UpdateUserUseCase{
    private readonly logger= new Logger(UpdateUserUseCase.name);
    constructor(
        @Inject('IUserRepository')
        private readonly userRepository: IUserRepository,
         private readonly authservice: AuthService,
    ){}
        async execute(id:string , dataUser:UserDto):Promise<User>{
        try {
            const existingUser = await this.userRepository.getUserById(id);
            if(!existingUser){
                throw new Error('User not found');
            }
            const password = dataUser.passwordHash ? await this.authservice.hashPassword(dataUser.passwordHash) : existingUser.getPassword();
            const updatedUser = await this.userRepository.updateUser(id, { ...dataUser, passwordHash:password  });
            return updatedUser;
        } catch (error) {
            this.logger.error('Failed to update user');
            throw new Error('Failed to update user');   
        }
    }

}