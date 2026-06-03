import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './controllers/auth.controller';
import { UserRepository } from './users/infrastructure/repository/user.rpository';
import { UserMapper } from './users/domain/mappers/user.mapper';
import { JwtStrategy } from './strategies/jwt.strategie';
import { RegisterUserUseCase } from './usecases/register.user.use-case';
import { LoginUserUseCase } from './usecases/login.use-case';
import { PassportModule } from '@nestjs/passport';
import { AuthMeUseCase } from './usecases/authme.usecase';
import { LogoutUserUseCase } from './usecases/logout-user.usecase';
import { UpdateUserUseCase } from './users/application/usecases/update-user.usecase';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenUseCase } from './usecases/refresh-token';
import { GenerateOfflineSessionUseCase } from './usecases/generate-offline-session.use-case';
import { PinLoginUseCase } from './usecases/pin-login.use-case';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // services
    AuthService,
    // use cases
    RegisterUserUseCase,
    LoginUserUseCase,
    AuthMeUseCase,
    PrismaService,
    LogoutUserUseCase,
    UpdateUserUseCase,
    RefreshTokenUseCase,
    GenerateOfflineSessionUseCase,
    PinLoginUseCase,
    // OtpMapper,

    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    // {
    //   provide: OtpRepositoryName,
    //   useClass: OtpRepository,
    // },
    // mapper
    UserMapper,
    // guards
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
