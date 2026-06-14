import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  DocumentCategory,
  DocumentVisibility,
  DueDiligenceCategory,
} from '@baalvion-invest/database';

export class PresignUploadDto {
  @IsString() fileName!: string;
  @IsString() mimeType!: string;
  @Type(() => Number) @IsInt() @Min(1) sizeBytes!: number;
  @IsEnum(DocumentCategory) category!: DocumentCategory;
  @IsOptional() @IsEnum(DocumentVisibility) visibility?: DocumentVisibility;
  @IsOptional() @IsString() dealId?: string;
  @IsOptional() @IsString() companyId?: string;
}

export class ConfirmUploadDto {
  @IsString() s3Bucket!: string;
  @IsString() s3Key!: string;
  @IsString() fileName!: string;
  @IsString() mimeType!: string;
  @Type(() => Number) @IsInt() sizeBytes!: number;
  @IsEnum(DocumentCategory) category!: DocumentCategory;
  @IsOptional() @IsEnum(DocumentVisibility) visibility?: DocumentVisibility;
  @IsOptional() @IsString() dealId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() checksumSha256?: string;
}

export class DueDiligenceItemDto {
  @IsEnum(DueDiligenceCategory) category!: DueDiligenceCategory;
  @IsString() title!: string;
  @IsOptional() @IsString() assigneeUserId?: string;
}
