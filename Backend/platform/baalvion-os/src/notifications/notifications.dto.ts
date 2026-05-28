import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsIn(['in_app', 'email', 'push'])
  channel?: 'in_app' | 'email' | 'push';

  @IsOptional() @IsObject()
  data?: Record<string, any>;
}
