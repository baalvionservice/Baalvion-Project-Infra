
export type CampaignExecutionStatus = "not_started" | "active" | "in_review" | "completed";
export type CreatorExecutionStatus = "pending" | "accepted" | "completed";
export type DeliverableExecutionStatus = "pending" | "submitted" | "approved";

export interface CampaignCreator {
  creatorId: string;
  name: string;
  status: CreatorExecutionStatus;
}

export interface CampaignDeliverable {
  id: string;
  creatorId: string;
  creatorName: string;
  type: "post" | "reel" | "story" | "youtube";
  status: DeliverableExecutionStatus;
  submissionUrl?: string;
  dueDate: string;
}

export interface CampaignExecution {
  id: string;
  proposalId: string;
  dealId: string;
  name: string;
  companyName: string;
  status: CampaignExecutionStatus;
  creators: CampaignCreator[];
  deliverables: CampaignDeliverable[];
  startDate: string;
  endDate: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
