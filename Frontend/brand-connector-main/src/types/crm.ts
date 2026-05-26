
export type LeadStatus = "new" | "contacted" | "replied" | "booked" | "closed" | "lost";
export type LeadPriority = "high" | "medium" | "low";

export interface ScoreBreakdown {
  engagement: number;
  completeness: number;
  nicheValue: number;
  activity: number;
}

export interface Lead {
  id: string;
  companyName: string;
  niche: string;
  email?: string;
  instagramHandle?: string;
  website?: string;
  score: number;
  priority: LeadPriority;
  scoreBreakdown?: ScoreBreakdown;
  status: LeadStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastScoredAt?: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
}

export interface LeadFilters {
  status?: LeadStatus | 'all';
  niche?: string | 'all';
  priority?: LeadPriority | 'all';
  search?: string;
  page?: number;
}

export interface ScoringInsights {
  high: number;
  medium: number;
  low: number;
  avgScore: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pages: number;
  };
}
