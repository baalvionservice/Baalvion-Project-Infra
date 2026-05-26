
export type OutreachCampaignType = "email" | "dm";
export type OutreachCampaignStatus = "draft" | "running" | "paused" | "completed";
export type OutreachMessageStatus = "pending" | "sent" | "delivered" | "replied";

export interface OutreachCampaign {
  id: string;
  name: string;
  type: OutreachCampaignType;
  status: OutreachCampaignStatus;
  totalLeads: number;
  sentCount: number;
  replyCount: number;
  messageTemplate: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachMessage {
  id: string;
  leadId: string;
  leadName: string;
  campaignId: string;
  subject?: string;
  message: string;
  status: OutreachMessageStatus;
  sentAt?: string;
  replyText?: string;
  isInterested?: boolean;
}

export interface CreateCampaignPayload {
  name: string;
  type: OutreachCampaignType;
  leadIds: string[];
  messageTemplate: string;
  subject?: string;
}
