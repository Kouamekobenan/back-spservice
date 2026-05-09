import { ApiProperty } from '@nestjs/swagger';
import { ProductComponent } from '../../domain/entities/product-component.entity.js';

export class ProductComponentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  composedId: string;

  @ApiProperty()
  componentId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false })
  componentName?: string;

  @ApiProperty({ required: false })
  componentBarcode?: string | null;

  static fromDomain(entity: ProductComponent): ProductComponentResponseDto {
    const dto = new ProductComponentResponseDto();
    dto.id = entity.getId();
    dto.composedId = entity.getComposedId();
    dto.componentId = entity.getComponentId();
    dto.quantity = entity.getQuantity();
    dto.componentName = entity.getComponentName();
    dto.componentBarcode = entity.getComponentBarcode();
    return dto;
  }
}
