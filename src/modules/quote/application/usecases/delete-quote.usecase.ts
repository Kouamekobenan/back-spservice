import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IQuoteRepository } from '../../domain/interfaces/quote.repository.interface.js';

@Injectable()
export class DeleteQuoteUseCase {
  constructor(
    @Inject('IQuoteRepository')
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.quoteRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Devis ${id} non trouvé`);
    }

    if (existing.getStatus() === 'CONVERTED') {
      throw new BadRequestException('Impossible de supprimer un devis déjà converti en vente.');
    }

    await this.quoteRepository.delete(id);
  }
}
