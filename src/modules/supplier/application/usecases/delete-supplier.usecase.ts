import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ISupplierRepository } from '../../domain/interfaces/supplier-repository.interface.js';

@Injectable()
export class DeleteSupplierUseCase {
  private readonly logger = new Logger(DeleteSupplierUseCase.name);

  constructor(
    @Inject('ISupplierRepository')
    private readonly supplierRepository: ISupplierRepository,
  ) {}

  async execute(id: string): Promise<void> {
    this.logger.log(`Suppression du fournisseur: ${id}`);
    
    const existingSupplier = await this.supplierRepository.findById(id);
    if (!existingSupplier) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} non trouvé`);
    }
    
    await this.supplierRepository.delete(id);
  }
}
