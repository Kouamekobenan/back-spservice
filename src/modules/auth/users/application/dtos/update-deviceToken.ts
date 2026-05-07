// src/auth/users/application/dtos/update-device-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateDeviceTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  deviceToken!: string;
}
