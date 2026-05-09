import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UserModule } from './modules/auth/users/user.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module.js';
import { CategoryModule } from './modules/category/category.module.js';
import { UnitModule } from './modules/unit/unit.module.js';
import { ProductModule } from './modules/product/product.module.js';
import { ProductComponentModule } from './modules/product-component/product-component.module.js';
import { ProductBatchModule } from './modules/product-batch/product-batch.module.js';

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
    UnitModule,
    ProductModule,
    ProductComponentModule,
    ProductBatchModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
