// dtos/paginate-user-query.dto.ts
import { IsOptional, IsNumberString, IsEnum, IsString } from 'class-validator';
import { UserRole } from '../../domain/enums/role.enum';

export class PaginateUserQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
