
export type CreatorTier = "micro" | "mid" | "macro";
export type CreatorPlatform = "instagram" | "youtube" | "tiktok";

export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: CreatorPlatform;
  followers: number;
  engagementRate: number;
  niche: string;
  location: string;
  tier: CreatorTier;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  completedCampaigns: number;
  bio: string;
}

export interface CreatorFilters {
  search?: string;
  niche?: string | 'all';
  platform?: CreatorPlatform | 'all';
  tier?: CreatorTier | 'all';
  minFollowers?: number;
  maxFollowers?: number;
}
