import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { AuditService } from './audit.service';
import { CreateLogDto } from './audit.dto';

@ApiTags('system-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles('admin')
  list(@Query('limit') limit?: string) {
    return this.audit.list(limit ? Number(limit) : 100);
  }

  @Post()
  log(@Body() dto: CreateLogDto, @CurrentUser() user: AuthUser) {
    return this.audit.log(dto, user?.keycloakId);
  }
}
