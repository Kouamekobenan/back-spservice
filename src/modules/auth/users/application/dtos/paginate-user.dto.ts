import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginateDto {
  @ApiPropertyOptional({ example: 1, description: 'Numéro de la page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page: number=1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Nombre d’éléments par page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit: number= 10;
}
