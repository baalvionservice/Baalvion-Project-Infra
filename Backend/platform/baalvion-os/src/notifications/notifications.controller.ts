import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query('userId') userId: string) {
    return this.notifications.listForUser(userId);
  }

  @Post()
  @Roles('admin', 'recruiter', 'brand')
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(dto);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }
}
