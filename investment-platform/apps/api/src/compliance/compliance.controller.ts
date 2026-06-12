import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import type { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { SumsubService } from './sumsub.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SubjectType } from '@baalvion-invest/database';

class StartKycDto {
  @IsEnum(SubjectType)
  subjectType!: SubjectType;
}

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly compliance: ComplianceService,
    private readonly sumsub: SumsubService,
  ) {}

  @Post('kyc/start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartKycDto) {
    return this.compliance.startKyc(user.orgId, user.userId, dto.subjectType);
  }

  @Get('kyc/status')
  status(@CurrentUser('orgId') orgId: string) {
    return this.compliance.status(orgId);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhooks/sumsub')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-payload-digest') signature: string,
    @Body() payload: any,
  ) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(payload));
    if (!this.sumsub.verifyWebhook(raw, signature)) {
      return { success: false, error: 'invalid signature' };
    }
    await this.compliance.handleWebhook(payload);
    return { success: true };
  }
}
