import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get('JWT_ACCESS_SECRET') || configService.get('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  async validate(payload: any) {
    // Récupérer les accès boutiques de l'utilisateur
    const userAccesses = await this.prisma.userShopAccess.findMany({
      where: { userId: payload.sub },
      select: { shopId: true }
    });

    return { 
      userId: payload.sub, 
      phone: payload.phone, 
      role: payload.role,
      shopAccesses: userAccesses.map(a => a.shopId) // Liste des IDs de boutiques autorisées
    };
  }
}
