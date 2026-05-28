import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { JobStatus } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsBoolean()
  remote?: boolean;

  @IsOptional() @IsString()
  employmentType?: string;

  @IsOptional() @IsNumber()
  salaryMin?: number;

  @IsOptional() @IsNumber()
  salaryMax?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];
}

export class UpdateJobDto extends CreateJobDto {
  @IsOptional()
  declare title: string;
}

export class JobQueryDto {
  @IsOptional() @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsString()
  q?: string;
}
