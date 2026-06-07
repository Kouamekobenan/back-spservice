import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './modules/auth/users/user.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module.js';
import { CategoryModule } from './modules/category/category.module.js';
import { UnitModule } from './modules/unit/unit.module.js';
import { ProductModule } from './modules/product/product.module.js';
import { ProductComponentModule } from './modules/product-component/product-component.module.js';
import { ProductBatchModule } from './modules/product-batch/product-batch.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { CreditPaymentModule } from './modules/credit-payment/credit-payment.module.js';
import { CashSessionModule } from './modules/cash-session/cash-session.module.js';
import { SaleModule } from './modules/sale/sale.module.js';
import { SupplierModule } from './modules/supplier/supplier.module.js';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module.js';
import { StockTransferModule } from './modules/stock-transfer/stock-transfer.module.js';
import { ExpenseModule } from './modules/expense/expense.module.js';
import { ShopSettingModule } from './modules/shop-setting/shop-setting.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { UserShopAccessModule } from './modules/user-shop-access/user-shop-access.module';
import { SuperAdminModule } from './modules/dashbord-superAdmin/superAdmin.module.js';
import { SyncQueueModule } from './modules/sync-queue/sync-queue.module.js';
import { SyncModule } from './modules/sync/sync.module.js';
import { CashierDashboardModule } from './modules/cashier-dashboard/cashier-dashboard.module.js';
import { ReportExportModule } from './modules/report-export/report-export.module.js';

@Module({
  imports: [
    //  ConfigModule (sans les options de ServeStatic)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    // Vos autres modules
    UserModule,
    AuthModule,
    ShopModule,
    CategoryModule,
    UnitModule,
    ProductModule,
    ProductComponentModule,
    ProductBatchModule,
    CustomerModule,
    CreditPaymentModule,
    CashSessionModule,
    SaleModule,
    SupplierModule,
    PurchaseOrderModule,
    StockTransferModule,
    ExpenseModule,
    ShopSettingModule,
    AuditLogModule,
    UserShopAccessModule,
    SuperAdminModule,
    SyncQueueModule,
    SyncModule,
    CashierDashboardModule,
    ReportExportModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
