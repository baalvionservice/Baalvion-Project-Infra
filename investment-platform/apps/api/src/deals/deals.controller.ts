import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import {
  AddMemberDto,
  CreateDealDto,
  PostMessageDto,
  UpdateDealStatusDto,
} from './dto/deal.dto';
import { DealRoomGateway } from './deal-room.gateway';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('deals')
export class DealsController {
  constructor(
    private readonly deals: DealsService,
    private readonly gateway: DealRoomGateway,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDealDto) {
    return this.deals.create(user.orgId, user.userId, dto);
  }

  @Get()
  list(@CurrentUser('orgId') orgId: string) {
    return this.deals.list(orgId);
  }

  @Get(':id')
  get(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.deals.get(orgId, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.deals.messages(orgId, id);
  }

  @Post(':id/messages')
  async post(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
  ) {
    const message = await this.deals.postMessage(user.orgId, user.userId, id, dto);
    this.gateway.broadcastMessage(id, message);
    return message;
  }

  @Post(':id/members')
  addMember(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.deals.addMember(orgId, id, dto);
  }

  @Post(':id/nda')
  nda(@CurrentUser('orgId') orgId: string, @Param('id') id: string) {
    return this.deals.createNda(orgId, id);
  }

  @Patch(':id/status')
  status(
    @CurrentUser('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealStatusDto,
  ) {
    return this.deals.updateStatus(orgId, id, dto);
  }
}
