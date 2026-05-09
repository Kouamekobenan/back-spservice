import { Module } from '@nestjs/common';
import { SupplierController } from './presentation/controllers/supplier.controller.js';
import { SupplierRepository } from './infrastructure/supplier-repository.impl.js';
import { SupplierMapper } from './domain/mappers/supplier.mapper.js';
import { CreateSupplierUseCase } from './application/usecases/create-supplier.usecase.js';
import { GetAllSuppliersUseCase } from './application/usecases/get-all-suppliers.usecase.js';
import { GetSupplierByIdUseCase } from './application/usecases/get-supplier-by-id.usecase.js';
import { UpdateSupplierUseCase } from './application/usecases/update-supplier.usecase.js';
import { DeleteSupplierUseCase } from './application/usecases/delete-supplier.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [SupplierController],
  providers: [
    PrismaService,
    SupplierMapper,
    CreateSupplierUseCase,
    GetAllSuppliersUseCase,
    GetSupplierByIdUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    {
      provide: 'ISupplierRepository',
      useClass: SupplierRepository,
    },
  ],
  exports: [
    {
      provide: 'ISupplierRepository',
      useClass: SupplierRepository,
    },
  ],
})
export class SupplierModule {}
