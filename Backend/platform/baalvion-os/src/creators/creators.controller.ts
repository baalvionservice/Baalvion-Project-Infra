import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatorsService } from './creators.service';
import { CreateCreatorDto, UpdateCreatorDto } from './creators.dto';

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creators: CreatorsService) {}

  @Get()
  list() {
    return this.creators.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.creators.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'creator')
  @Post()
  create(@Body() dto: CreateCreatorDto) {
    return this.creators.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'creator')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCreatorDto) {
    return this.creators.update(id, dto);
  }
}
