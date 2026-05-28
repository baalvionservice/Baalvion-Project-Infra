import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CampaignsService } from './campaigns.service';
import {
  ApplyDto,
  CreateCampaignDto,
  CreateDeliverableDto,
  UpdateCampaignDto,
  UpdateDeliverableStatusDto,
} from './campaigns.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  list() {
    return this.campaigns.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.campaigns.findOne(id);
  }

  @Roles('admin', 'brand')
  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Roles('admin', 'brand')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaigns.update(id, dto);
  }

  @Get(':id/applications')
  listApplications(@Param('id') id: string) {
    return this.campaigns.listApplications(id);
  }

  @Roles('admin', 'creator')
  @Post(':id/applications')
  apply(@Param('id') id: string, @Body() dto: ApplyDto) {
    return this.campaigns.apply(id, dto);
  }

  @Get(':id/deliverables')
  listDeliverables(@Param('id') id: string) {
    return this.campaigns.listDeliverables(id);
  }

  @Roles('admin', 'creator')
  @Post(':id/deliverables')
  addDeliverable(@Param('id') id: string, @Body() dto: CreateDeliverableDto) {
    return this.campaigns.addDeliverable(id, dto);
  }

  @Roles('admin', 'brand')
  @Patch('deliverables/:deliverableId/status')
  updateDeliverableStatus(
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateDeliverableStatusDto,
  ) {
    return this.campaigns.updateDeliverableStatus(deliverableId, dto);
  }
}
