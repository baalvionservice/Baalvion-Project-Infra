import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsOptional() @IsArray() @IsString({ each: true })
  participants?: string[];

  @IsOptional() @IsString()
  subject?: string;
}

export class CreateMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  senderId: string;

  @IsOptional() @IsString()
  text?: string;

  @IsOptional() @IsString()
  attachmentKey?: string;
}

export class MessageQueryDto {
  @IsOptional() @IsUUID()
  conversationId?: string;
}
