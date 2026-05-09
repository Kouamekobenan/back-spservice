import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '@prisma/client';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity.js';

export class PurchaseOrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantityOrdered: number;

  @ApiProperty()
  quantityReceived: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalCost: number;
}

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ enum: PurchaseOrderStatus })
  status: PurchaseOrderStatus;

  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  shopId: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  amountPaid: number;

  @ApiProperty({ required: false })
  expectedAt: Date | null;

  @ApiProperty({ required: false })
  receivedAt: Date | null;

  @ApiProperty({ required: false })
  notes: string | null;

  @ApiProperty({ type: [PurchaseOrderItemResponseDto] })
  items: PurchaseOrderItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(order: PurchaseOrder): PurchaseOrderResponseDto {
    const dto = new PurchaseOrderResponseDto();
    dto.id = order.getId();
    dto.orderNumber = order.getOrderNumber();
    dto.status = order.getStatus();
    dto.supplierId = order.getSupplierId();
    dto.shopId = order.getShopId();
    dto.subtotal = order.getSubtotal();
    dto.totalAmount = order.getTotalAmount();
    dto.amountPaid = order.getAmountPaid();
    dto.expectedAt = order.getExpectedAt();
    dto.receivedAt = order.getReceivedAt();
    dto.notes = order.getNotes();
    dto.createdAt = order.getCreatedAt();
    dto.updatedAt = order.getUpdatedAt();
    dto.items = order.getItems().map(item => ({
      productId: item.getProductId(),
      quantityOrdered: item.getQuantityOrdered(),
      quantityReceived: item.getQuantityReceived(),
      unitCost: item.getUnitCost(),
      totalCost: item.getTotalCost(),
    }));
    return dto;
  }
}
