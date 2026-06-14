import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import {
  CompanyProfileDto,
  FounderDto,
  UpsertCompanyDto,
} from './dto/company.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Roles('OWNER', 'ADMIN')
  @Post()
  upsert(@CurrentUser('orgId') orgId: string, @Body() dto: UpsertCompanyDto) {
    return this.companies.upsert(orgId, dto);
  }

  @Get('me')
  get(@CurrentUser('orgId') orgId: string) {
    return this.companies.get(orgId);
  }

  @Roles('OWNER', 'ADMIN')
  @Put('me/profile')
  profile(@CurrentUser('orgId') orgId: string, @Body() dto: CompanyProfileDto) {
    return this.companies.setProfile(orgId, dto);
  }

  @Roles('OWNER', 'ADMIN')
  @Post('me/founders')
  founder(@CurrentUser('orgId') orgId: string, @Body() dto: FounderDto) {
    return this.companies.addFounder(orgId, dto);
  }

  @Roles('OWNER', 'ADMIN')
  @Post('me/submit')
  submit(@CurrentUser('orgId') orgId: string) {
    return this.companies.submit(orgId);
  }

  @Get('me/cap-table')
  capTable(@CurrentUser('orgId') orgId: string) {
    return this.companies.capTable(orgId);
  }
}
