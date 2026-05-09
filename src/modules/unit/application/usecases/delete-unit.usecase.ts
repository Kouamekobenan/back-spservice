import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IUnitRepository } from '../../domain/interfaces/unit-repository.interface.js';

@Injectable()
export class DeleteUnitUseCase {
  constructor(
    @Inject('IUnitRepository')
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const unitExists = await this.unitRepository.findById(id);
    if (!unitExists) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    await this.unitRepository.delete(id);
  }
}
