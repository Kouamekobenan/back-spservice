import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { SnapshotQueryDto, SnapshotResponseDto } from '../dtos/sync.dto.js';

// Entités supportées par le snapshot et leur modèle Prisma associé
const SNAPSHOT_ENTITIES: Record<string, { model: keyof PrismaService; hasShop: boolean }> = {
  products:   { model: 'product',       hasShop: true  },
  customers:  { model: 'customer',      hasShop: false },
  categories: { model: 'category',      hasShop: true  },
  units:      { model: 'unit',          hasShop: false },
  suppliers:  { model: 'supplier',      hasShop: false },
  expenses:   { model: 'expense',       hasShop: true  },
};

@Injectable()
export class GetSnapshotUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: SnapshotQueryDto): Promise<SnapshotResponseDto> {
    const { shopId, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;

    // Entités demandées (toutes par défaut)
    const requestedKeys = query.entities
      ? query.entities.split(',').map((e) => e.trim().toLowerCase())
      : Object.keys(SNAPSHOT_ENTITIES);

    const result: SnapshotResponseDto = {
      serverTime: new Date().toISOString(),
      shopId: shopId ?? null,
      entities: {},
    };

    await Promise.all(
      requestedKeys.map(async (key) => {
        const config = SNAPSHOT_ENTITIES[key];
        if (!config) return;

        const model = this.prisma[config.model] as any;
        if (!model) return;

        const where: Record<string, unknown> = {};
        if (config.hasShop && shopId) where.shopId = shopId;
        if ('isActive' in (model as any)) where.isActive = true;

        const [data, total] = await Promise.all([
          model.findMany({ where, skip, take: limit, orderBy: { createdAt: 'asc' } }),
          model.count({ where }),
        ]);

        result.entities[key] = {
          data,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        };
      }),
    );

    return result;
  }
}
