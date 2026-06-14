import { Body, Controller, Get, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PortfolioService } from './portfolio.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PayoutType } from '@baalvion-invest/database';

class CreateDistributionDto {
  @IsString() investorOrgId!: string;
  @IsOptional() @IsString() investmentId?: string;
  @IsEnum(PayoutType) type!: PayoutType;
  @Type(() => Number) @IsNumber() grossAmount!: number;
  @IsOptional() @Type(() => Number) @IsNumber() taxWithheld?: number;
  @IsOptional() @IsString() currency?: string;
}

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  summary(@CurrentUser('orgId') orgId: string) {
    return this.portfolio.summary(orgId);
  }

  @Get('returns')
  returns(@CurrentUser('orgId') orgId: string) {
    return this.portfolio.returns(orgId);
  }

  @Get('distributions')
  distributions(@CurrentUser('orgId') orgId: string) {
    return this.portfolio.distributions(orgId);
  }

  @Get('tax-documents')
  tax(@CurrentUser('orgId') orgId: string) {
    return this.portfolio.taxDocuments(orgId);
  }

  @Roles('OWNER', 'ADMIN')
  @Post('distributions')
  createDistribution(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreateDistributionDto,
  ) {
    return this.portfolio.createDistribution(orgId, dto);
  }
}
