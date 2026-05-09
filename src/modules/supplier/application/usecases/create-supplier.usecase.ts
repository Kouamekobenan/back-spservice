import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateSupplierDto } from '../dtos/create-supplier-dto.dto.js';
import { SupplierResponseDto } from '../dtos/supplier-response.dto.js';
import type { ISupplierRepository } from '../../domain/interfaces/supplier-repository.interface.js';

@Injectable()
export class CreateSupplierUseCase {
  private readonly logger = new Logger(CreateSupplierUseCase.name);

  constructor(
    @Inject('ISupplierRepository')
    private readonly supplierRepository: ISupplierRepository,
  ) {}

  async execute(createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    this.logger.log(`Création d'un nouveau fournisseur: ${createSupplierDto.name}`);
    const supplier = await this.supplierRepository.create(createSupplierDto);
    return SupplierResponseDto.fromDomain(supplier);
  }
}
