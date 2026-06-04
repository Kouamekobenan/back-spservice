import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../domain/enums/role.enum';

export class UserDto {
  @IsOptional() @IsString() id?: string;

  @ApiPropertyOptional({ example: 'jean.dupont' })
  @IsOptional() @IsString() username?: string;

  @ApiProperty({ example: 'password123' })
  @IsOptional() @IsString() password?: string;

  @ApiPropertyOptional({ description: 'Alias de password' })
  @IsOptional() @IsString() passwordHash?: string;

  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsOptional() @IsString() name?: string;

  @ApiPropertyOptional({ example: '+2250701020304' })
  @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CASHIER })
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional() @IsString() pin?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() shopId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() localId?: string;
}
