import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { MatchingService } from './matching.service';
import {
  CreateOpportunityDto,
  DiscoverOpportunitiesDto,
} from './dto/opportunity.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly matching: MatchingService,
  ) {}

  @Get()
  discover(@Query() dto: DiscoverOpportunitiesDto) {
    return this.opportunities.discover(dto);
  }

  @Get('recommended')
  recommended(@CurrentUser('orgId') orgId: string) {
    return this.matching.scoreForInvestor(orgId);
  }

  @Get('mine')
  mine(@CurrentUser('orgId') orgId: string) {
    return this.opportunities.mine(orgId);
  }

  @Get('watchlist')
  watchlist(@CurrentUser('orgId') orgId: string) {
    return this.opportunities.watchlist(orgId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.opportunities.get(id);
  }

  @Roles('OWNER', 'ADMIN')
  @Post()
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateOpportunityDto) {
    return this.opportunities.create(orgId, dto);
  }

  @Roles('OWNER', 'ADMIN')
  @Post(':id/publish')
  publish(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.opportunities.publish(orgId, id);
  }

  @Post(':id/watch')
  watch(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.opportunities.addToWatchlist(orgId, id);
  }
}
