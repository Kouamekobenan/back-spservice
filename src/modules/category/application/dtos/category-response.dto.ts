import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../domain/entities/category.entity.js';

export class CategoryResponseDto {
  @ApiProperty({
    description: "L'identifiant unique de la catégorie (UUID v4)",
    example: 'd3b07384-d113-4c4e-9c8e-cfbfc4c8dfef',
  })
  id: string;

  @ApiProperty({
    description: 'Le nom de la catégorie',
    example: 'Électronique',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Une description détaillée de la catégorie',
    example: 'Tous les appareils électroniques et gadgets.',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Le code couleur hexadécimal associé pour le design',
    example: '#FF5733',
    nullable: true,
  })
  colorHex: string | null;

  @ApiPropertyOptional({
    description: "Le nom de l'icône à afficher côté frontend",
    example: 'tv-outline',
    nullable: true,
  })
  iconName: string | null;

  @ApiPropertyOptional({
    description: "L'ID de la catégorie parente si c'est une sous-catégorie",
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nullable: true,
  })
  parentId: string | null;

  @ApiPropertyOptional({
    description: "L'ID de la boutique associée",
    example: 'shop_9f8e7d6c',
    nullable: true,
  })
  shopId?: string | null;

  @ApiProperty({
    description: 'La date de création de la catégorie',
    example: '2026-03-30T14:22:10.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'La date de la dernière mise à jour',
    example: '2026-05-29T17:25:00.000Z',
  })
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
    dto.shopId = category.getShopId();
    return dto;
  }
}
