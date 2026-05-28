import { IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCreatorDto {
  @IsUUID()
  userId: string;

  @IsString()
  handle: string;

  @IsOptional() @IsString()
  bio?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  niches?: string[];

  @IsOptional() @IsObject()
  rateCard?: Record<string, any>;
}

export class UpdateCreatorDto {
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) niches?: string[];
  @IsOptional() @IsBoolean() verified?: boolean;
  @IsOptional() @IsObject() rateCard?: Record<string, any>;
}
