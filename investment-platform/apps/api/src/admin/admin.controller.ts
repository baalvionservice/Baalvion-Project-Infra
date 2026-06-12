import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * All routes require an elevated role. In production these map to PLATFORM-org
 * operators; COMPLIANCE may review, ADMIN may action.
 */
@Roles('ADMIN', 'COMPLIANCE')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('metrics')
  metrics() {
    return this.admin.metrics();
  }

  @Get('kyc-queue')
  kyc() {
    return this.admin.kycQueue();
  }

  @Get('compliance-cases')
  cases() {
    return this.admin.complianceCases();
  }

  @Get('accreditation-queue')
  accreditation() {
    return this.admin.accreditationQueue();
  }

  @Post('accreditation/:id/review')
  reviewAccreditation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: { decision: 'VERIFIED' | 'REJECTED' },
  ) {
    return this.admin.reviewAccreditation(id, userId, body.decision);
  }

  @Get('company-queue')
  companyQueue() {
    return this.admin.companyReviewQueue();
  }

  @Post('company/:id/review')
  reviewCompany(
    @Param('id') id: string,
    @Body() body: { approve: boolean },
  ) {
    return this.admin.reviewCompany(id, body.approve);
  }
}
