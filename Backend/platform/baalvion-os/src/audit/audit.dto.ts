import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateLogDto {
  @IsString()
  action: string;

  @IsOptional() @IsString()
  entity?: string;

  @IsOptional() @IsString()
  entityId?: string;

  @IsOptional() @IsString()
  ip?: string;

  @IsOptional() @IsObject()
  meta?: Record<string, any>;
}
