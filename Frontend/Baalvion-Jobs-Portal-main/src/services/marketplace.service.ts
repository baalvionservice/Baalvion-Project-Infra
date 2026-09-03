import { apiClient } from '@/lib/apiClient';

export type MarketplaceProject = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  status: string;
  requiredSkills: string[];
  budget: number | null;
  currency: string | null;
  country: string | null;
  /** 'solo' | 'team' | 'either' — what the poster will accept. */
  collaborationMode: 'solo' | 'team' | 'either';
  maxTeamSize: number | null;
  roles: { title?: string; count?: number }[];
  deadline: string | null;
  applicationsCount: number;
  publishedAt: string | null;
  createdAt: string | null;
};

export type ProjectApplicationInput = {
  mode: 'solo' | 'team';
  pitch: string;
  teamName?: string;
  teamMembers?: { name: string; email?: string; role?: string }[];
  role?: string;
  portfolioUrl?: string;
  expectedRate?: number;
  currency?: string;
  availability?: string;
};

/**
 * The project marketplace.
 *
 * Browsing is public — you shouldn't need an account to see what work is going — while
 * applying needs a session so the bid attaches to a real candidate record. The two
 * halves are deliberately separate calls for that reason.
 */
export const marketplaceService = {
  async listProjects(params: {
    page?: number;
    limit?: number;
    category?: string;
    skill?: string;
    mode?: string;
    search?: string;
  } = {}) {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        q.set(key, String(value));
      }
    }
    const qs = q.toString();
    const res = await apiClient.get<any>(`/marketplace/projects${qs ? `?${qs}` : ''}`);
    const raw: any = res.success ? res.data : null;
    return {
      items: (raw?.items ?? []) as MarketplaceProject[],
      total: raw?.pagination?.total ?? 0,
      page: raw?.pagination?.page ?? 1,
      totalPages: raw?.pagination?.totalPages ?? 0,
    };
  },

  async getProject(slugOrId: string): Promise<MarketplaceProject | null> {
    const res = await apiClient.get<MarketplaceProject>(`/marketplace/projects/${slugOrId}`);
    return res.success ? (res.data as MarketplaceProject) : null;
  },

  /** Filter options built from live projects, so no filter ever returns nothing. */
  async getFacets() {
    const res = await apiClient.get<any>('/marketplace/facets');
    const data: any = res.success ? res.data : null;
    return {
      categories: (data?.categories ?? []) as string[],
      skills: (data?.skills ?? []) as string[],
      modes: (data?.modes ?? []) as string[],
    };
  },

  async apply(projectId: string, input: ProjectApplicationInput) {
    const res = await apiClient.post<any>(`/marketplace/projects/${projectId}/apply`, input);
    if (!res.success) throw new Error(res.error || 'Could not submit your application');
    return res.data;
  },

  async myApplications() {
    const res = await apiClient.get<any[]>('/me/project-applications');
    return res.success && Array.isArray(res.data) ? res.data : [];
  },
};
