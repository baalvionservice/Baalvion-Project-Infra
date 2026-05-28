import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { JobsService } from './jobs.service';
import { CreateJobDto, JobQueryDto, UpdateJobDto } from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  // Public listing — open job board
  @Get()
  list(@Query() query: JobQueryDto) {
    return this.jobs.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'recruiter')
  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: AuthUser) {
    return this.jobs.create(dto, user?.keycloakId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'recruiter')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobs.remove(id);
  }
}
