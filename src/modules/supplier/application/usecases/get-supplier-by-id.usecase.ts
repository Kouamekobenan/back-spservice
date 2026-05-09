import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupplierResponseDto } from '../dtos/supplier-response.dto.js';
import type { ISupplierRepository } from '../../domain/interfaces/supplier-repository.interface.js';

@Injectable()
export class GetSupplierByIdUseCase {
  private readonly logger = new Logger(GetSupplierByIdUseCase.name);

  constructor(
    @Inject('ISupplierRepository')
    private readonly supplierRepository: ISupplierRepository,
  ) {}

  async execute(id: string): Promise<SupplierResponseDto> {
    this.logger.log(`Récupération du fournisseur par ID: ${id}`);
    const supplier = await this.supplierRepository.findById(id);
    
    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    
    return SupplierResponseDto.fromDomain(supplier);
  }
}
