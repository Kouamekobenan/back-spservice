import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../domain/entities/category.entity.js';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty({ required: false })
  colorHex: string | null;

  @ApiProperty({ required: false })
  iconName: string | null;

  @ApiProperty({ required: false })
  parentId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.getId();
    dto.name = category.getName();
    dto.description = category.getDescription();
    dto.colorHex = category.getColorHex();
    dto.iconName = category.getIconName();
    dto.parentId = category.getParentId();
    dto.createdAt = category.getCreatedAt();
    dto.updatedAt = category.getUpdatedAt();
    return dto;
  }
}
