import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { OrgsService } from './orgs.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

class UpdateOrgDto {
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() registrationNo?: string;
  @IsOptional() @IsString() @Length(2, 2) country?: string;
}

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  @Get('current')
  current(@CurrentUser('orgId') orgId: string) {
    return this.orgs.current(orgId);
  }

  @Roles('OWNER', 'ADMIN')
  @Patch('current')
  update(@CurrentUser('orgId') orgId: string, @Body() dto: UpdateOrgDto) {
    return this.orgs.update(orgId, dto);
  }

  @Get('current/members')
  members(@CurrentUser('orgId') orgId: string) {
    return this.orgs.members(orgId);
  }
}
