export interface AuthorSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

export interface AuthorSocial {
  x?: string;
  linkedin?: string;
}

export interface WebsiteAuthor {
  id: string;
  websiteId: string;
  slug: string;
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
  avatarUrl?: string;
  expertise: string[];
  social?: AuthorSocial;
  seoMetadata?: AuthorSeo;
  status: 'active' | 'inactive';
  sortOrder: number;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuthorPayload {
  websiteId: string;
  name: string;
  slug?: string;
  title?: string | null;
  credentials?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  expertise?: string[];
  social?: AuthorSocial;
  seoMetadata?: AuthorSeo;
  sortOrder?: number;
}

export interface UpdateAuthorPayload {
  name?: string;
  slug?: string;
  title?: string | null;
  credentials?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  expertise?: string[];
  social?: AuthorSocial;
  seoMetadata?: AuthorSeo;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}
