
export type ScraperPlatform = 'instagram' | 'linkedin';

export interface ScrapedLead {
  id: string;
  platform: ScraperPlatform;
  companyName: string;
  handle: string;
  followers?: number;
  niche?: string;
  bio?: string;
  website?: string;
  email?: string;
  score?: number;
  createdAt: string;
  isEnriched?: boolean;
}

export interface EnrichedLead {
  id: string;
  companyName: string;
  website?: string;
  estimatedTraffic?: number;
  emailPattern?: string;
  linkedinCompany?: string;
  confidenceScore?: number;
}

export interface ScrapeSession {
  id: string;
  query: string;
  platform: ScraperPlatform;
  leadCount: number;
  timestamp: string;
}
