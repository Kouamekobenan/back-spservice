import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE })
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;

  @ApiProperty({ example: 'Product' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiPropertyOptional({ example: 'uuid-123' })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 'uuid-shop' })
  @IsUUID()
  @IsNotEmpty()
  shopId: string;

  @ApiPropertyOptional({ example: { name: 'Old Product' } })
  @IsOptional()
  dataBefore?: any;

  @ApiPropertyOptional({ example: { name: 'New Product' } })
  @IsOptional()
  dataAfter?: any;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'Manual adjustment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
