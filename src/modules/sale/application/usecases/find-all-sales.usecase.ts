import { Inject, Injectable } from '@nestjs/common';
import type { ISaleRepository } from '../../domain/interfaces/sale.repository.interface.js';
import { FilterSaleDto } from '../dtos/filter-sale.dto.js';
import { PaginatedSaleResponseDto, toSaleResponseDto } from '../dtos/sale-response.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

@Injectable()
export class FindAllSalesUseCase {
  constructor(
    @Inject('ISaleRepository')
    private readonly saleRepository: ISaleRepository,
  ) {}

  async execute(filters: FilterSaleDto): Promise<PaginatedSaleResponseDto> {
    const result = await this.saleRepository.findAll(filters);

    return {
      data:       result.data.map(toSaleResponseDto),
      total:      result.total,
      page:       result.page,
      totalPages: result.totalPages,
      limit:      result.limit,
    };
  }
}
