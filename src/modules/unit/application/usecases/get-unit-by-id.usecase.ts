import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';
import { UnitResponseDto } from '../dtos/unit-response.dto.js';

@Injectable()
export class GetUnitByIdUseCase {
  constructor(
    @Inject('IUnitRepository')
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(id: string): Promise<UnitResponseDto> {
    const unit = await this.unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    return UnitResponseDto.fromDomain(unit);
  }
}
