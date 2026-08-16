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
  facebook?: string;
  instagram?: string;
}

export type AuthorEditorialRole = 'writer' | 'reviewer' | 'fact-checker' | 'contributor';

export interface WebsiteAuthor {
  id: string;
  websiteId: string;
  slug: string;
  name: string;
  title?: string;
  credentials?: string;
  bio?: string;
  avatarUrl?: string;
  videoUrl?: string;
  expertise: string[];
  education?: string[];
  certifications?: string[];
  editorialRole?: AuthorEditorialRole | null;
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
  videoUrl?: string | null;
  expertise?: string[];
  education?: string[];
  certifications?: string[];
  editorialRole?: AuthorEditorialRole | null;
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
  videoUrl?: string | null;
  expertise?: string[];
  education?: string[];
  certifications?: string[];
  editorialRole?: AuthorEditorialRole | null;
  social?: AuthorSocial;
  seoMetadata?: AuthorSeo;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}
