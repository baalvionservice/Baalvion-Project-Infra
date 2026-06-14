import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DocumentsService } from './documents.service';
import {
  ConfirmUploadDto,
  DueDiligenceItemDto,
  PresignUploadDto,
} from './dto/document.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('documents/presign')
  presign(@CurrentUser('orgId') orgId: string, @Body() dto: PresignUploadDto) {
    return this.documents.presignUpload(orgId, dto);
  }

  @Post('documents')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.documents.confirmUpload(user.orgId, user.userId, dto);
  }

  @Get('documents')
  list(
    @CurrentUser('orgId') orgId: string,
    @Query('dealId') dealId?: string,
  ) {
    return this.documents.list(orgId, dealId);
  }

  @Get('documents/:id/download')
  download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.documents.download(user.orgId, user.userId, id, req.ip);
  }

  // ── due diligence (deal-scoped) ──────────────────────────────────────────

  @Post('deals/:dealId/due-diligence')
  addDd(@Param('dealId') dealId: string, @Body() dto: DueDiligenceItemDto) {
    return this.documents.addDueDiligenceItem(dealId, dto);
  }

  @Get('deals/:dealId/due-diligence')
  dd(@Param('dealId') dealId: string) {
    return this.documents.dueDiligence(dealId);
  }

  @Patch('due-diligence/:itemId')
  setDd(
    @Param('itemId') itemId: string,
    @Body() body: { status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETE' | 'FLAGGED'; evidenceDocumentId?: string },
  ) {
    return this.documents.setDueDiligenceStatus(
      itemId,
      body.status,
      body.evidenceDocumentId,
    );
  }
}
