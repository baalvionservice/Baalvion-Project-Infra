import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { SecurityType, TermSheetAction } from '@baalvion-invest/database';

export class TermSheetVersionDto {
  @IsEnum(TermSheetAction) action!: TermSheetAction;
  @Type(() => Number) @IsNumber() amount!: number;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @Type(() => Number) @IsNumber() equityPct?: number;
  @IsOptional() @Type(() => Number) @IsNumber() valuation?: number;
  @IsOptional() @IsEnum(SecurityType) securityType?: SecurityType;
  @IsOptional() boardRights?: Record<string, unknown>;
  @IsOptional() investorRights?: Record<string, unknown>;
  @IsOptional() exitRights?: Record<string, unknown>;
}

export class SignDto {
  @IsString() envelopeId!: string;
}
