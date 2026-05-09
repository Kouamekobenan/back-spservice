import { ApiProperty } from '@nestjs/swagger';
import { Supplier } from '../../domain/entities/supplier-entity.entity.js';

export class SupplierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  contact: string | null;

  @ApiProperty({ required: false })
  phone: string | null;

  @ApiProperty({ required: false })
  email: string | null;

  @ApiProperty({ required: false })
  address: string | null;

  @ApiProperty({ required: false })
  notes: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(supplier: Supplier): SupplierResponseDto {
    const dto = new SupplierResponseDto();
    dto.id = supplier.getId();
    dto.name = supplier.getName();
    dto.contact = supplier.getContact();
    dto.phone = supplier.getPhone();
    dto.email = supplier.getEmail();
    dto.address = supplier.getAddress();
    dto.notes = supplier.getNotes();
    dto.isActive = supplier.getIsActive();
    dto.createdAt = supplier.getCreatedAt();
    dto.updatedAt = supplier.getUpdatedAt();
    return dto;
  }
}
