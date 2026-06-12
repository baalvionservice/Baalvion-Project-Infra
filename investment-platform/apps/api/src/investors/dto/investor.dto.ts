import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  AccreditationMethod,
  InvestorType,
  RiskAppetite,
} from '@baalvion-invest/database';

export class UpsertInvestorProfileDto {
  @IsEnum(InvestorType)
  type!: InvestorType;

  @IsOptional() @IsString() thesis?: string;
  @IsOptional() @IsString() aumBand?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() contactEmail?: string;
}

export class InvestmentPreferenceDto {
  @IsOptional() @IsArray() @IsString({ each: true }) industries?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) stages?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) geographies?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() ticketMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() ticketMax?: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @IsEnum(RiskAppetite) riskAppetite?: RiskAppetite;
}

export class AccreditationDto {
  @IsEnum(AccreditationMethod)
  method!: AccreditationMethod;

  @IsString() @Length(2, 2) jurisdiction!: string;

  @IsOptional() @IsString() evidenceDocumentId?: string;
}
