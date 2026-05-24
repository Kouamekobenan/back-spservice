import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly saltRounds = 10;

  //  Hasher le mot de passe utilisateur
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  async hashRefreshToken(refreshToken: string): Promise<string> {
    return bcrypt.hash(refreshToken, this.saltRounds);
  }
  // 🔍 Comparer les mots de passe
  async compareHashRefreshToken(
    refreshToken: string,
    hashRefreshToken: string,
  ): Promise<boolean> {
    return bcrypt.compare(refreshToken, hashRefreshToken);
  }
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  // Générer les deux tokens (access + refresh)
  async generateTokens(payload: {
    userId: string;
    phone?: string;
    role: string;
  }) {
    const accessToken = this.jwtService.sign(
      {
        sub: payload.userId,
        phone: payload.phone,
        role: payload.role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
        expiresIn: '1d', // durée de vie du access token
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: payload.userId,
        phone: payload.phone,
        role: payload.role,
      },
      {
        secret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d', // durée de vie du refresh token
      },
    );
    return { accessToken, refreshToken};
  }
  // Vérifier la validité d’un refresh token
  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      return null;
    }
  }
}
