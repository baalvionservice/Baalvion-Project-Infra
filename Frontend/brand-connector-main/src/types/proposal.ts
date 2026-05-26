
export type ProposalStatus = "draft" | "sent" | "approved" | "rejected";
export type CreatorTier = "micro" | "mid" | "macro";
export type DeliverableType = "instagram_post" | "reel" | "story" | "youtube_video";

export interface Deliverable {
  id: string;
  type: DeliverableType;
  quantity: number;
  creatorTier: CreatorTier;
  pricePerUnit: number;
}

export interface PricingItem {
  label: string;
  amount: number;
}

export interface Proposal {
  id: string;
  dealId: string;
  companyName: string;
  totalPrice: number;
  status: ProposalStatus;
  deliverables: Deliverable[];
  pricingBreakdown: PricingItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
