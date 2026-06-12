import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { CompanyStage } from '@baalvion-invest/database';

export class UpsertCompanyDto {
  @IsString() @Length(2, 200) legalName!: string;
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsString() registrationNo?: string;
  @IsOptional() @IsString() @Length(2, 2) country?: string;
  @IsOptional() @IsString() industryCode?: string;
  @IsOptional() @IsEnum(CompanyStage) stage?: CompanyStage;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() foundedYear?: number;
}

export class CompanyProfileDto {
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() problem?: string;
  @IsOptional() @IsString() solution?: string;
  @IsOptional() traction?: Record<string, unknown>;
  @IsOptional() @Type(() => Number) @IsInt() teamSize?: number;
  @IsOptional() @Type(() => Number) @IsNumber() fundingRaised?: number;
  @IsOptional() @Type(() => Number) @IsNumber() fundingTarget?: number;
  @IsOptional() @Type(() => Number) @IsNumber() valuationTarget?: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
}

export class FounderDto {
  @IsString() name!: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() linkedinUrl?: string;
  @IsOptional() @Type(() => Number) @IsNumber() equityPct?: number;
  @IsOptional() @IsString() bio?: string;
}
