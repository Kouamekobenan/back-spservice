import { Product } from '../entities/product.entity.js';
import { CreateProductDto } from '../../application/dtos/create-product.dto.js';
import { UpdateProductDto } from '../../application/dtos/update-product.dto.js';
import { ProductQueryDto } from '../../application/dtos/product-query.dto.js';
import { PaginatedResponseRepository } from '../../../../common/types/response-respository.js';

export interface IProductRepository {
  create(data: CreateProductDto): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(query: ProductQueryDto): Promise<PaginatedResponseRepository<Product>>;
  update(id: string, data: UpdateProductDto): Promise<Product>;
  delete(id: string): Promise<void>;
  findByBarcode(barcode: string, shopId: string): Promise<Product | null>;
  findBySku(sku: string, shopId: string): Promise<Product | null>;
  getLowStockAlerts(shopId: string): Promise<Product[]>;
  updateStock(id: string, quantity: number): Promise<Product>;
}
