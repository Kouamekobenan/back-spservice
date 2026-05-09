import { ProductComponent } from '../entities/product-component.entity.js';
import type {AddProductComponentDto } from '../../application/dtos/add-component.dto.js';
import { UpdateProductComponentQtyDto } from '../../application/dtos/update-component-qty.dto.js';

export interface IProductComponentRepository {
  addComponent(data: AddProductComponentDto): Promise<ProductComponent>;
  removeComponent(id: string): Promise<void>;
  updateQuantity(id: string, data: UpdateProductComponentQtyDto): Promise<ProductComponent>;
  findByKitId(kitId: string): Promise<ProductComponent[]>;
  findById(id: string): Promise<ProductComponent | null>;
  exists(composedId: string, componentId: string): Promise<boolean>;
}
