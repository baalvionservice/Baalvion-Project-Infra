import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { SignDto, TermSheetVersionDto } from './dto/investment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller()
export class InvestmentsController {
  constructor(private readonly investments: InvestmentsService) {}

  @Post('deals/:dealId/term-sheets')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId') dealId: string,
    @Body() dto: TermSheetVersionDto,
  ) {
    return this.investments.submitTermSheet(user.orgId, user.userId, dealId, dto);
  }

  @Post('deals/:dealId/term-sheets/accept')
  accept(@CurrentUser('orgId') orgId: string, @Param('dealId') dealId: string) {
    return this.investments.acceptTermSheet(orgId, dealId);
  }

  @Post('deals/:dealId/signatures')
  envelope(
    @CurrentUser('orgId') orgId: string,
    @Param('dealId') dealId: string,
    @Body() body: { documentId?: string },
  ) {
    return this.investments.createSignatureEnvelope(orgId, dealId, body.documentId);
  }

  @Post('signatures/sign')
  sign(@CurrentUser() user: AuthenticatedUser, @Body() dto: SignDto) {
    return this.investments.sign(user.userId, dto);
  }

  @Get('investments')
  list(@CurrentUser('orgId') orgId: string) {
    return this.investments.investments(orgId);
  }

  @Get('positions')
  positions(@CurrentUser('orgId') orgId: string) {
    return this.investments.positions(orgId);
  }
}
