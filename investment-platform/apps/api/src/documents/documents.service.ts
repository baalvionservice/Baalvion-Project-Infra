import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Service } from './s3.service';
import type {
  ConfirmUploadDto,
  DueDiligenceItemDto,
  PresignUploadDto,
} from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async presignUpload(orgId: string, dto: PresignUploadDto) {
    const { bucket, key } = this.s3.newKey(orgId, dto.fileName);
    const uploadUrl = await this.s3.presignUpload(bucket, key, dto.mimeType);
    return { uploadUrl, s3Bucket: bucket, s3Key: key };
  }

  async confirmUpload(orgId: string, userId: string, dto: ConfirmUploadDto) {
    return this.prisma.document.create({
      data: {
        orgId,
        dealId: dto.dealId,
        companyId: dto.companyId,
        category: dto.category,
        visibility: dto.visibility ?? 'PRIVATE',
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        s3Bucket: dto.s3Bucket,
        s3Key: dto.s3Key,
        checksumSha256: dto.checksumSha256,
        virusScanStatus: 'PENDING',
        uploadedByUserId: userId,
      },
    });
  }

  async list(orgId: string, dealId?: string) {
    return this.prisma.document.findMany({
      where: dealId ? { dealId } : { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        category: true,
        visibility: true,
        mimeType: true,
        sizeBytes: true,
        version: true,
        virusScanStatus: true,
        createdAt: true,
      },
    });
  }

  /** Presigned download with access-control + audit logging. */
  async download(orgId: string, userId: string, documentId: string, ip?: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const allowed = await this.canAccess(orgId, doc);
    if (!allowed) throw new ForbiddenException('No access to this document');
    if (doc.virusScanStatus === 'INFECTED') {
      throw new ForbiddenException('Document failed virus scan');
    }

    const url = await this.s3.presignDownload(doc.s3Bucket, doc.s3Key);
    await this.prisma.documentAccessLog.create({
      data: { documentId, userId, action: 'DOWNLOAD', ipAddress: ip },
    });
    return { url, fileName: doc.fileName, expiresInSeconds: 300 };
  }

  // ── due diligence ──────────────────────────────────────────────────────────

  async addDueDiligenceItem(dealId: string, dto: DueDiligenceItemDto) {
    return this.prisma.dueDiligenceItem.create({
      data: {
        dealId,
        category: dto.category,
        title: dto.title,
        assigneeUserId: dto.assigneeUserId,
        status: 'OPEN',
      },
    });
  }

  async dueDiligence(dealId: string) {
    const items = await this.prisma.dueDiligenceItem.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    });
    const complete = items.filter((i) => i.status === 'COMPLETE').length;
    return {
      items,
      progress: {
        total: items.length,
        complete,
        pct: items.length ? Math.round((complete / items.length) * 100) : 0,
      },
    };
  }

  async setDueDiligenceStatus(
    itemId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETE' | 'FLAGGED',
    evidenceDocumentId?: string,
  ) {
    return this.prisma.dueDiligenceItem.update({
      where: { id: itemId },
      data: { status, evidenceDocumentId },
    });
  }

  // ── access control ───────────────────────────────────────────────────────

  private async canAccess(orgId: string, doc: { orgId: string; visibility: string; id: string; dealId: string | null }) {
    if (doc.orgId === orgId) return true;
    if (doc.visibility === 'PUBLIC') return true;

    // Deal participants may access deal-scoped documents subject to grant.
    if (doc.dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: doc.dealId } });
      const participant =
        deal && (deal.investorOrgId === orgId || deal.companyOrgId === orgId);
      if (participant && doc.visibility === 'APPROVED') return true;
    }

    const grant = await this.prisma.documentAccessGrant.findFirst({
      where: {
        documentId: doc.id,
        granteeOrgId: orgId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return !!grant;
  }
}
