export type WebsiteStatus = 'active' | 'inactive' | 'maintenance' | 'archived';
export type WebsitePlan = 'basic' | 'pro' | 'enterprise';
export type WebsiteModule =
  | 'blog'
  | 'pages'
  | 'products'
  | 'jobs'
  | 'events'
  | 'portfolio'
  | 'news'
  | 'docs';

export type CmsRole =
  | 'cms_admin'
  | 'cms_editor'
  | 'cms_author'
  | 'cms_contributor'
  | 'cms_reviewer'
  | 'cms_compliance'
  | 'cms_publisher'
  | 'cms_seo_manager'
  | 'cms_viewer';

export const CMS_ROLE_LABELS: Record<CmsRole, string> = {
  cms_admin: 'CMS Admin',
  cms_editor: 'Editor',
  cms_author: 'Author',
  cms_contributor: 'Contributor',
  cms_reviewer: 'Reviewer',
  cms_compliance: 'Compliance',
  cms_publisher: 'Publisher',
  cms_seo_manager: 'SEO Manager',
  cms_viewer: 'Viewer',
};

export const CMS_ROLE_LEVEL: Record<CmsRole, number> = {
  cms_admin: 100,
  cms_editor: 80,
  cms_publisher: 70,
  cms_compliance: 65,
  cms_reviewer: 60,
  cms_seo_manager: 50,
  cms_author: 40,
  cms_contributor: 20,
  cms_viewer: 10,
};

export interface WebsiteConfig {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  postsPerPage: number;
  enableComments: boolean;
  enableAnalytics: boolean;
  googleAnalyticsId?: string;
  seoDefaults: {
    titleSuffix?: string;
    defaultMetaDescription?: string;
    defaultOgImage?: string;
  };
}

export interface Website {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  domain: string;
  status: WebsiteStatus;
  plan: WebsitePlan;
  modules: WebsiteModule[];
  config: WebsiteConfig;
  contentCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface WebsiteMember {
  id: number;
  websiteId: string;
  userId: number;
  cmsRole: CmsRole;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  joinedAt: string;
}

export interface WebsiteStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  pendingReview: number;
  totalMedia: number;
  mediaStorageUsedMb: number;
  pageViewsThisMonth: number;
}

export interface CreateWebsitePayload {
  name: string;
  slug: string;
  domain: string;
  plan?: WebsitePlan;
  modules?: WebsiteModule[];
  config?: Partial<WebsiteConfig>;
}

export interface UpdateWebsitePayload {
  name?: string;
  domain?: string;
  status?: WebsiteStatus;
  modules?: WebsiteModule[];
  config?: Partial<WebsiteConfig>;
}

export interface AddWebsiteMemberPayload {
  /** Invite by email (resolved to a platform user server-side) — the primary path. */
  email?: string;
  /** Or invite by an already-known numeric user id. */
  userId?: number;
  role: CmsRole;
}

export interface UserSearchResult {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  isMember: boolean;
}
