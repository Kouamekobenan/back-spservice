import { Injectable } from '@nestjs/common';
import { Supplier } from '../entities/supplier-entity.entity.js';
import { CreateSupplierDto } from '../../application/dtos/create-supplier-dto.dto.js';
import { UpdateSupplierDto } from '../../application/dtos/update-supplier-dto.dto.js';
import { Prisma, Supplier as SupplierPrisma } from '@prisma/client';

@Injectable()
export class SupplierMapper {
  toPersistence(data: CreateSupplierDto): Prisma.SupplierCreateInput {
    return {
      name: data.name,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
      isActive: data.isActive ?? true,
    };
  }

  toDomain(supplierData: SupplierPrisma): Supplier {
    return new Supplier(
      supplierData.id,
      supplierData.name,
      supplierData.contact,
      supplierData.phone,
      supplierData.email,
      supplierData.address,
      supplierData.notes,
      supplierData.isActive,
      supplierData.createdAt,
      supplierData.updatedAt,
    );
  }

  toUpdatePersistence(data: UpdateSupplierDto): Prisma.SupplierUpdateInput {
    const updateData: Prisma.SupplierUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.contact !== undefined) updateData.contact = data.contact;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return updateData;
  }
}
