import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupplierQueryDto } from '../dtos/supplier-query.dto.js';
import { SupplierResponseDto } from '../dtos/supplier-response.dto.js';
import type { ISupplierRepository } from '../../domain/interfaces/supplier-repository.interface.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class GetAllSuppliersUseCase {
  private readonly logger = new Logger(GetAllSuppliersUseCase.name);

  constructor(
    @Inject('ISupplierRepository')
    private readonly supplierRepository: ISupplierRepository,
  ) {}

  async execute(query: SupplierQueryDto): Promise<PaginatedResponseRepository<SupplierResponseDto>> {
    this.logger.log('Récupération de tous les fournisseurs paginés');
    const result = await this.supplierRepository.findAll(query);
    
    return {
      ...result,
      data: result.data.map((supplier) => SupplierResponseDto.fromDomain(supplier)),
    };
  }
}
