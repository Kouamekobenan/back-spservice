import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { StockTransferStatus } from '../../domain/entities/stock-transfer.entity.js';

export class UpdateStockTransferStatusDto {
  @ApiProperty({ enum: ['COMPLETED', 'CANCELLED'], description: 'Nouveau statut du transfert' })
  @IsEnum(['COMPLETED', 'CANCELLED'])
  @IsNotEmpty()
  status: StockTransferStatus;

  @ApiProperty({ example: 'user-uuid-123', description: 'ID de l\'utilisateur validant/annulant le transfert' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
