import { Injectable } from '@nestjs/common';
import { Customer } from '../entities/customer-entity.entity.js';
import { CreateCustomerDto } from '../../application/dtos/create-customer.dto.js';
import { UpdateCustomerDto } from '../../application/dtos/update-customer.dto.js';
import { Prisma, Customer as CustomerPrisma } from '@prisma/client';

@Injectable()
export class CustomerMapper {
  toPersistence(data: CreateCustomerDto): Prisma.CustomerCreateInput {
    return {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      creditLimit: data.creditLimit,
      notes: data.notes,
      localId: data.localId,
    };
  }

  toApplication(customerData: CustomerPrisma): Customer {
    return new Customer(
      customerData.id,
      customerData.name,
      customerData.phone,
      customerData.email,
      customerData.address,
      customerData.totalDebt,
      customerData.creditLimit,
      customerData.notes,
      customerData.syncStatus,
      customerData.localId,
      customerData.createdAt,
      customerData.updatedAt,
    );
  }

  toUpdatePersistence(data: UpdateCustomerDto): Prisma.CustomerUpdateInput {
    const updateData: Prisma.CustomerUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.creditLimit !== undefined) updateData.creditLimit = data.creditLimit;
    if (data.totalDebt !== undefined) updateData.totalDebt = data.totalDebt;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return updateData;
  }
}
