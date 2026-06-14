import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { configuration } from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrgsModule } from './orgs/orgs.module';
import { InvestorsModule } from './investors/investors.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CompaniesModule } from './companies/companies.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { DealsModule } from './deals/deals.module';
import { DocumentsModule } from './documents/documents.module';
import { InvestmentsModule } from './investments/investments.module';
import { PaymentsModule } from './payments/payments.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CryptoModule,
    NotificationsModule,
    // Phase 1
    AuthModule,
    // Phase 2
    UsersModule,
    OrgsModule,
    InvestorsModule,
    ComplianceModule,
    CompaniesModule,
    OpportunitiesModule,
    DealsModule,
    DocumentsModule,
    // Phase 3
    InvestmentsModule,
    PaymentsModule,
    PortfolioModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: rate-limit → authenticate → authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
