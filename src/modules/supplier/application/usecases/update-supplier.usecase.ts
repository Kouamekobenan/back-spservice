import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateSupplierDto } from '../dtos/update-supplier-dto.dto.js';
import { SupplierResponseDto } from '../dtos/supplier-response.dto.js';
import type { ISupplierRepository } from '../../domain/interfaces/supplier-repository.interface.js';

@Injectable()
export class UpdateSupplierUseCase {
  private readonly logger = new Logger(UpdateSupplierUseCase.name);

  constructor(
    @Inject('ISupplierRepository')
    private readonly supplierRepository: ISupplierRepository,
  ) {}

  async execute(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(`Mise à jour du fournisseur: ${id}`);
    
    const existingSupplier = await this.supplierRepository.findById(id);
    if (!existingSupplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    
    const updatedSupplier = await this.supplierRepository.update(id, updateSupplierDto);
    return SupplierResponseDto.fromDomain(updatedSupplier);
  }
}
