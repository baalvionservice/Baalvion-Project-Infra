import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

const SCOPES = ['resume', 'image', 'document', 'invoice', 'deliverable', 'avatar', 'other'];

export class PresignDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;

  @IsOptional() @IsIn(SCOPES)
  scope?: string;

  @IsOptional() @IsInt()
  sizeBytes?: number;
}
