import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class PinLoginDto {
  @ApiPropertyOptional({ example: 'jean.dupont', description: "Nom d'utilisateur — alternatif au téléphone" })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: '+2250701020304', description: "Numéro de téléphone — alternatif au username" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1234', description: 'Code PIN à 4 chiffres' })
  @IsString()
  @IsNotEmpty()
  // @Matches(/^[0-9]{4}$/, { message: 'Le PIN doit être composé de 4 chiffres' })
  pin!: string;
}

export class OfflineSessionResponseDto {
  @ApiProperty({ description: 'Token offline valide 30 jours' })
  offlineToken!: string;

  @ApiProperty({ description: "Date d'expiration du token offline" })
  expiresAt!: Date;

  @ApiProperty({ description: 'Snapshot utilisateur pour stockage local' })
  user!: {
    id: string;
    username: string;
    name: string | null;
    role: string;
    pin: string | null;
    phone: string | null;
    shopAccesses: Array<{ shopId: string; shopName: string; roleInShop: string | null }>;
  };
}
