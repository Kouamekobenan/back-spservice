import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ShopSettingDto {
  @ApiProperty({ 
    description: 'Unique identifier of the setting',
    example: '550e8400-e29b-41d4-a716-446655440000' 
  })
  id: string;

  @ApiProperty({ 
    description: 'ID of the shop this setting belongs to. Use null for global settings.',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nullable: true 
  })
  shopId: string | null;

  @ApiProperty({ 
    description: 'The unique key/name of the setting',
    example: 'receipt_header' 
  })
  key: string;

  @ApiProperty({ 
    description: 'The value assigned to this setting',
    example: 'Welcome to our premium shop!' 
  })
  value: string;

  @ApiProperty({ 
    description: 'Group category for organization (receipt, tax, sync, display)',
    example: 'receipt',
    default: 'general'
  })
  group: string;
}

export class CreateShopSettingDto {
  @ApiProperty({ 
    description: 'Target shop ID or null for global system settings',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nullable: true
  })
  @IsOptional() // Allow null/undefined for global
  shopId: string | null;

  @ApiProperty({ 
    description: 'Setting key (ex: currency_symbol, tax_rate, receipt_footer)',
    example: 'currency_symbol' 
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ 
    description: 'The actual value of the setting as a string',
    example: 'XOF' 
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ 
    description: 'Module group for filtering settings in UI',
    example: 'display',
    default: 'general' 
  })
  @IsString()
  @IsOptional()
  group?: string;
}

export class UpdateShopSettingDto {
  @ApiProperty({ 
    description: 'The new value to apply to the setting',
    example: 'CFA' 
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
