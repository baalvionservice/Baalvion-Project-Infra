import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { MatchingService } from './matching.service';

@Module({
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, MatchingService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
