import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, UpdateCandidateDto } from './candidates.dto';

@ApiTags('candidates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('admin', 'recruiter')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get()
  list() {
    return this.candidates.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.candidates.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.candidates.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidates.update(id, dto);
  }
}
