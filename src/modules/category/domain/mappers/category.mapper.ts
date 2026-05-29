import { Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity.js';
import { CreateCategoryDto } from '../../application/dtos/create-category.dto.js';
import { UpdateCategoryDto } from '../../application/dtos/update-category.dto.js';
import { Prisma, Category as CategoryPrisma } from '@prisma/client';

@Injectable()
export class CategoryMapper {
  toPersistence(data: CreateCategoryDto): Prisma.CategoryCreateInput {
    const persistenceData: Prisma.CategoryCreateInput = {
      name: data.name,
      description: data.description,
      colorHex: data.colorHex,
      iconName: data.iconName,
      shop: data.shopId
        ? {
            connect: { id: data.shopId },
          }
        : undefined,
    };
    if (data.parentId) {
      persistenceData.parent = {
        connect: { id: data.parentId },
      };
      if(data.shopId) {
        persistenceData.shop = {
          connect: { id: data.shopId },
        };
      }
    }

    return persistenceData;
  }

  toDomain(categoryData: CategoryPrisma): Category {
    return new Category(
      categoryData.id,
      categoryData.name,
      categoryData.description,
      categoryData.colorHex,
      categoryData.iconName,
      categoryData.parentId,
      categoryData.shopId,
      categoryData.createdAt,
      categoryData.updatedAt,
    );
  }

  toUpdatePersistence(data: UpdateCategoryDto): Prisma.CategoryUpdateInput {
    const updateData: Prisma.CategoryUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.colorHex !== undefined) updateData.colorHex = data.colorHex;
    if (data.iconName !== undefined) updateData.iconName = data.iconName;
    
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: data.parentId } };
      }
      if(data.shopId !== undefined) {
        updateData.shop = {
          connect: { id: data.shopId },
        };
      }
    }

    return updateData;
  }
}
