import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { ApplicationsService } from './applications.service';
import {
  ApplicationQueryDto,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from './applications.dto';

@ApiTags('job-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @Roles('admin', 'recruiter')
  list(@Query() query: ApplicationQueryDto) {
    return this.applications.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.applications.findOne(id);
  }

  // A candidate/client submits an application
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applications.create(dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'recruiter')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.applications.updateStatus(id, dto);
  }
}
