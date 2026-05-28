import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCandidateDto {
  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  resumeKey?: string;

  @IsOptional() @IsObject()
  profile?: Record<string, any>;
}

export class UpdateCandidateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() resumeKey?: string;
  @IsOptional() @IsObject() profile?: Record<string, any>;
}
