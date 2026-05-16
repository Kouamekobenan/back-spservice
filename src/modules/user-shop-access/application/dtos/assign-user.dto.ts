import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class AssignUserDto {
  @ApiProperty({
    enum: Role,
    description: "Rôle attribué à l'utilisateur pour cette boutique",
    example: Role.CASHIER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  roleInShop?: Role;
}
