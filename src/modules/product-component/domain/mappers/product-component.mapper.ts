import { Injectable } from '@nestjs/common';
import { ProductComponent } from '../entities/product-component.entity.js';
import { Prisma, ProductComponent as PrismaProductComponent } from '@prisma/client';

@Injectable()
export class ProductComponentMapper {
  toPersistence(data: any): Prisma.ProductComponentCreateInput {
    return {
      composed: { connect: { id: data.composedId } },
      component: { connect: { id: data.componentId } },
      quantity: new Prisma.Decimal(data.quantity),
    };
  }

  toDomain(prismaData: any): ProductComponent {
    return new ProductComponent(
      prismaData.id,
      prismaData.composedId,
      prismaData.componentId,
      Number(prismaData.quantity),
      prismaData.component?.name,
      prismaData.component?.barcode,
    );
  }
}
