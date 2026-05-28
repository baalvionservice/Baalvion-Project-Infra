import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ApplicationsModule } from './applications/applications.module';
import { AuditModule } from './audit/audit.module';
import { FilesModule } from './files/files.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagingModule } from './messaging/messaging.module';
import { CreatorsModule } from './creators/creators.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    CandidatesModule,
    ApplicationsModule,
    AuditModule,
    RealtimeModule,
    FilesModule,
    NotificationsModule,
    MessagingModule,
    CreatorsModule,
    CampaignsModule,
    BroadcastsModule,
    // Remaining brand domain (same pattern): disputes, transactions, reviews,
    // support-tickets, invites, portfolio, subscription-plans; plus content/cms/settings.
  ],
  controllers: [HealthController],
})
export class AppModule {}
