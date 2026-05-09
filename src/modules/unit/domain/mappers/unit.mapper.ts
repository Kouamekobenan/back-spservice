import { Injectable } from '@nestjs/common';
import { Unit } from '../entities/unit.entity.js';
import { CreateUnitDto } from '../../application/dtos/create-unit.dto.js';
import { Prisma, Unit as UnitPrisma } from '@prisma/client';
import { UpdateUnitDto } from '../../application/dtos/update-unit.dto.js';

@Injectable()
export class UnitMapper {
  toPersistence(data: CreateUnitDto): Prisma.UnitCreateInput {
    return {
      name: data.name,
      abbreviation: data.abbreviation,
    };
  }

  toDomain(unitData: UnitPrisma): Unit {
    return new Unit(
      unitData.id,
      unitData.name,
      unitData.abbreviation,
    );
  }

  toUpdatePersistence(data: UpdateUnitDto): Prisma.UnitUpdateInput {
    const updateData: Prisma.UnitUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.abbreviation !== undefined) updateData.abbreviation = data.abbreviation;
    return updateData;
  }
}
