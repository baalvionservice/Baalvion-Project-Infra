import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { SumsubService } from './sumsub.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, SumsubService],
  exports: [ComplianceService, SumsubService],
})
export class ComplianceModule {}
