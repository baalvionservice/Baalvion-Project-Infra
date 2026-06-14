import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { DealMemberRole, DealStatus } from '@baalvion-invest/database';

export class CreateDealDto {
  @IsString() opportunityId!: string;
}

export class PostMessageDto {
  @IsString() @Length(1, 5000) body!: string;
  @IsOptional() attachments?: unknown[];
}

export class AddMemberDto {
  @IsString() userId!: string;
  @IsString() orgId!: string;
  @IsOptional() @IsEnum(DealMemberRole) role?: DealMemberRole;
}

export class UpdateDealStatusDto {
  @IsEnum(DealStatus) status!: DealStatus;
}
