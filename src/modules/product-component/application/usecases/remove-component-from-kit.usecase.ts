import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {IProductComponentRepository } from '../../domain/interfaces/product-component-repository.interface.js';

@Injectable()
export class RemoveComponentFromKitUseCase {
  constructor(
    @Inject('IProductComponentRepository')
    private readonly repository: IProductComponentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new NotFoundException(`Lien composant avec l'ID ${id} non trouvé.`);
    }
    await this.repository.removeComponent(id);
  }
}
