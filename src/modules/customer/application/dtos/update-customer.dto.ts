import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({ description: 'Dette totale actuelle' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalDebt?: number;
}
