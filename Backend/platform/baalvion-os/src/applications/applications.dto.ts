import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @IsUUID()
  jobId: string;

  @IsOptional() @IsUUID()
  candidateId?: string;

  @IsOptional() @IsUUID()
  userId?: string;

  @IsOptional() @IsString()
  coverLetter?: string;

  @IsOptional() @IsString()
  resumeKey?: string;

  @IsOptional() @IsObject()
  answers?: Record<string, any>;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

export class ApplicationQueryDto {
  @IsOptional() @IsUUID()
  jobId?: string;

  @IsOptional() @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
