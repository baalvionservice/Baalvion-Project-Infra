import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  OpportunityStage,
  OpportunityVisibility,
  SecurityType,
} from '@baalvion-invest/database';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateOpportunityDto {
  @IsEnum(OpportunityStage) round!: OpportunityStage;
  @Type(() => Number) @IsNumber() amountSought!: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @Type(() => Number) @IsNumber() preMoneyValuation?: number;
  @IsOptional() @Type(() => Number) @IsNumber() equityOfferedPct?: number;
  @IsOptional() @IsEnum(SecurityType) securityType?: SecurityType;
  @IsOptional() @Type(() => Number) @IsNumber() minTicket?: number;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsEnum(OpportunityVisibility) visibility?: OpportunityVisibility;
}

export class DiscoverOpportunitiesDto extends PaginationDto {
  @IsOptional() @IsEnum(OpportunityStage) round?: OpportunityStage;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() industry?: string;
}
