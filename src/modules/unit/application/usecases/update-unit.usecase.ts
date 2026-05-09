import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';
import { UpdateUnitDto } from '../dtos/update-unit.dto.js';
import { UnitResponseDto } from '../dtos/unit-response.dto.js';

@Injectable()
export class UpdateUnitUseCase {
  constructor(
    @Inject('IUnitRepository')
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(id: string, data: UpdateUnitDto): Promise<UnitResponseDto> {
    const unitExists = await this.unitRepository.findById(id);
    if (!unitExists) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    const unit = await this.unitRepository.update(id, data);
    return UnitResponseDto.fromDomain(unit);
  }
}
