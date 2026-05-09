export class Supplier {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly contact: string | null,
    private readonly phone: string | null,
    private readonly email: string | null,
    private readonly address: string | null,
    private readonly notes: string | null,
    private readonly isActive: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getContact(): string | null {
    return this.contact;
  }

  getPhone(): string | null {
    return this.phone;
  }

  getEmail(): string | null {
    return this.email;
  }

  getAddress(): string | null {
    return this.address;
  }

  getNotes(): string | null {
    return this.notes;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
