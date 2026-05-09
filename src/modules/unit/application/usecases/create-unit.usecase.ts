import { Inject, Injectable } from '@nestjs/common';
import {type IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';
import { CreateUnitDto } from '../dtos/create-unit.dto.js';
import { UnitResponseDto } from '../dtos/unit-response.dto.js';

@Injectable()
export class CreateUnitUseCase {
  constructor(
    @Inject('IUnitRepository')
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(data: CreateUnitDto): Promise<UnitResponseDto> {
    const unit = await this.unitRepository.create(data);
    return UnitResponseDto.fromDomain(unit);
  }
}
