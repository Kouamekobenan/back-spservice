import { Inject, Injectable } from '@nestjs/common';
import {type IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';
import { UnitQueryDto } from '../dtos/unit-query.dto.js';
import { UnitResponseDto } from '../dtos/unit-response.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class GetAllUnitsUseCase {
  constructor(
    @Inject('IUnitRepository')
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(query: UnitQueryDto): Promise<PaginatedResponseRepository<UnitResponseDto>> {
    const paginatedUnits = await this.unitRepository.findAll(query);
    return {
      ...paginatedUnits,
      data: paginatedUnits.data.map(UnitResponseDto.fromDomain),
    };
  }
}
