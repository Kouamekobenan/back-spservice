import { PartialType } from '@nestjs/swagger';
import { CreateProductBatchDto } from './create-batch.dto.js';

export class UpdateProductBatchDto extends PartialType(CreateProductBatchDto) {}
