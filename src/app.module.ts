import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UserModule } from './modules/auth/users/user.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module.js';
import { CategoryModule } from './modules/category/category.module.js';

@Module({
  imports: [
    //  ConfigModule (sans les options de ServeStatic)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Vos autres modules
    UserModule,
    AuthModule,
    ShopModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
