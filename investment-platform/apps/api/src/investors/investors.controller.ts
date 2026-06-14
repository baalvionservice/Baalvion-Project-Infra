import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { InvestorsService } from './investors.service';
import {
  AccreditationDto,
  InvestmentPreferenceDto,
  UpsertInvestorProfileDto,
} from './dto/investor.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('investors')
export class InvestorsController {
  constructor(private readonly investors: InvestorsService) {}

  @Post('profile')
  upsert(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpsertInvestorProfileDto,
  ) {
    return this.investors.upsertProfile(orgId, dto);
  }

  @Get('profile')
  profile(@CurrentUser('orgId') orgId: string) {
    return this.investors.getProfile(orgId);
  }

  @Put('preferences')
  preferences(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: InvestmentPreferenceDto,
  ) {
    return this.investors.setPreferences(orgId, dto);
  }

  @Post('accreditation')
  accredit(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: AccreditationDto,
  ) {
    return this.investors.submitAccreditation(orgId, dto);
  }

  @Get('accreditation')
  accreditations(@CurrentUser('orgId') orgId: string) {
    return this.investors.listAccreditations(orgId);
  }
}
