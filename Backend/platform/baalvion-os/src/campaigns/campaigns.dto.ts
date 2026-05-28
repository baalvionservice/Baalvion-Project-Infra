import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { CampaignStatus, DeliverableStatus } from '@prisma/client';

export class CreateCampaignDto {
  @IsUUID()
  brandUserId: string;

  @IsString()
  title: string;

  @IsOptional() @IsString()
  brief?: string;

  @IsOptional() @IsNumber()
  budget?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class UpdateCampaignDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() brief?: string;
  @IsOptional() @IsNumber() budget?: number;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
}

export class ApplyDto {
  @IsUUID()
  creatorId: string;

  @IsOptional() @IsString()
  pitch?: string;

  @IsOptional() @IsNumber()
  quote?: number;
}

export class CreateDeliverableDto {
  @IsUUID()
  creatorId: string;

  @IsString()
  title: string;

  @IsOptional() @IsString()
  fileKey?: string;
}

export class UpdateDeliverableStatusDto {
  @IsEnum(DeliverableStatus)
  status: DeliverableStatus;
}
