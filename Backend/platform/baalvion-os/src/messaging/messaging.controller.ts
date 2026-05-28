import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { CreateConversationDto, CreateMessageDto, MessageQueryDto } from './messaging.dto';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  // GET /messages?conversationId=...  -> messages in a conversation
  // GET /messages?userId=...          -> conversations for a user
  @Get()
  list(@Query() query: MessageQueryDto & { userId?: string }) {
    if (query.conversationId) return this.messaging.getMessages(query.conversationId);
    if (query.userId) return this.messaging.listConversationsFor(query.userId);
    return [];
  }

  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.messaging.createConversation(dto);
  }

  @Post()
  send(@Body() dto: CreateMessageDto) {
    return this.messaging.sendMessage(dto);
  }
}
