import { ProductBatch } from '../entities/product-batch.entity.js';
import { CreateProductBatchDto } from '../../application/dtos/create-batch.dto.js';
import { UpdateProductBatchDto } from '../../application/dtos/update-batch.dto.js';

export interface IProductBatchRepository {
  create(data: CreateProductBatchDto): Promise<ProductBatch>;
  findById(id: string): Promise<ProductBatch | null>;
  findByProductId(productId: string): Promise<ProductBatch[]>;
  update(id: string, data: UpdateProductBatchDto): Promise<ProductBatch>;
  delete(id: string): Promise<void>;
  getExpiringSoon(shopId: string, days: number): Promise<ProductBatch[]>;
}
