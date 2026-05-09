import { Module } from '@nestjs/common';
import { UnitController } from './presentation/controllers/unit.controller.js';
import { UnitRepository } from './infrastructure/repository/unit.repository.js';
import { UnitMapper } from './domain/mappers/unit.mapper.js';
import { CreateUnitUseCase } from './application/usecases/create-unit.usecase.js';
import { GetAllUnitsUseCase } from './application/usecases/get-all-units.usecase.js';
import { GetUnitByIdUseCase } from './application/usecases/get-unit-by-id.usecase.js';
import { UpdateUnitUseCase } from './application/usecases/update-unit.usecase.js';
import { DeleteUnitUseCase } from './application/usecases/delete-unit.usecase.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  controllers: [UnitController],
  providers: [
    PrismaService,
    UnitMapper,
    CreateUnitUseCase,
    GetAllUnitsUseCase,
    GetUnitByIdUseCase,
    UpdateUnitUseCase,
    DeleteUnitUseCase,
    {
      provide: 'IUnitRepository',
      useClass: UnitRepository,
    },
  ],
  exports: [
    {
      provide: 'IUnitRepository',
      useClass: UnitRepository,
    },
  ],
})
export class UnitModule {}
