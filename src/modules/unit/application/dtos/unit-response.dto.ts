import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../../domain/entities/unit.entity.js';

export class UnitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  abbreviation: string;

  static fromDomain(unit: Unit): UnitResponseDto {
    const dto = new UnitResponseDto();
    dto.id = unit.getId();
    dto.name = unit.getName();
    dto.abbreviation = unit.getAbbreviation();
    return dto;
  }
}
