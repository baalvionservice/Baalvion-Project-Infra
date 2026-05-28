import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplyDto,
  CreateCampaignDto,
  CreateDeliverableDto,
  UpdateCampaignDto,
  UpdateDeliverableStatusDto,
} from './campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: { applications: true, deliverables: true },
    });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    return this.prisma.campaign.update({ where: { id }, data: { ...dto } });
  }

  // ── applications ──
  listApplications(campaignId: string) {
    return this.prisma.campaignApplication.findMany({ where: { campaignId }, include: { creator: true } });
  }

  apply(campaignId: string, dto: ApplyDto) {
    return this.prisma.campaignApplication.create({
      data: { campaignId, creatorId: dto.creatorId, pitch: dto.pitch, quote: dto.quote },
    });
  }

  // ── deliverables ──
  listDeliverables(campaignId: string) {
    return this.prisma.deliverable.findMany({ where: { campaignId } });
  }

  addDeliverable(campaignId: string, dto: CreateDeliverableDto) {
    return this.prisma.deliverable.create({
      data: { campaignId, creatorId: dto.creatorId, title: dto.title, fileKey: dto.fileKey },
    });
  }

  updateDeliverableStatus(id: string, dto: UpdateDeliverableStatusDto) {
    return this.prisma.deliverable.update({ where: { id }, data: { status: dto.status } });
  }
}
