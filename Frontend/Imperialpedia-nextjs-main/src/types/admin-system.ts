
/**
 * @fileOverview Unified type definitions for the Imperialpedia Super Admin System.
 */

export type AdminRole = 'Super Admin' | 'Admin' | 'Editor' | 'Writer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'active' | 'suspended';
  lastActive: string;
}

export interface AdminArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  status: 'draft' | 'review' | 'published';
  authorId: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  linkedArticles: string[]; // IDs
}

export interface APIKeyNode {
  id: string;
  service: string;
  key: string;
  status: 'active' | 'revoked';
  usage: string;
}

export interface AdPlacement {
  id: string;
  location: 'header' | 'sidebar' | 'footer';
  status: 'active' | 'paused';
  provider: string;
}

export interface SystemConfig {
  siteName: string;
  contactEmail: string;
  branding: {
    primaryColor: string;
    logoUrl: string;
  };
  features: {
    aiDrafting: boolean;
    autoLinking: boolean;
    realTimeMarket: boolean;
  };
}
