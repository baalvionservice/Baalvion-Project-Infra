// Central CMS role + permission model shared across the Users, Workflow, Media and
// Calendar modules. The product surfaces five primary roles (Admin / Editor / Writer /
// Reviewer / Publisher) which map onto the backend's richer cms_* role set. Contributor,
// SEO Manager and Viewer remain supported but are grouped under "more roles".

import type { CmsRole } from '@/lib/types/cms-website.types';
import { CMS_ROLE_LEVEL } from '@/lib/types/cms-website.types';
import type { UserRole } from '@/lib/types/auth.types';

export interface CmsRoleOption {
  value: CmsRole;
  label: string;
  description: string;
  /** One of the five headline roles shown first in pickers. */
  primary: boolean;
}

// Ordered highest-authority first. The five `primary` roles match the product spec.
export const CMS_ROLE_OPTIONS: CmsRoleOption[] = [
  { value: 'cms_admin', label: 'Admin', description: 'Full control — manage users, settings, publish & delete', primary: true },
  { value: 'cms_editor', label: 'Editor', description: 'Create, edit & publish all content', primary: true },
  { value: 'cms_publisher', label: 'Publisher', description: 'Publish and unpublish approved content', primary: true },
  { value: 'cms_reviewer', label: 'Reviewer', description: 'Review & approve submitted content', primary: true },
  { value: 'cms_author', label: 'Writer', description: 'Create & edit their own content', primary: true },
  { value: 'cms_seo_manager', label: 'SEO Manager', description: 'Manage SEO metadata & redirects', primary: false },
  { value: 'cms_contributor', label: 'Contributor', description: 'Draft content for review (cannot publish)', primary: false },
  { value: 'cms_viewer', label: 'Viewer', description: 'Read-only access', primary: false },
];

const OPTION_BY_ROLE: Record<CmsRole, CmsRoleOption> = CMS_ROLE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o }),
  {} as Record<CmsRole, CmsRoleOption>,
);

export const cmsRoleLabel = (role: CmsRole): string => OPTION_BY_ROLE[role]?.label ?? role;
export const cmsRoleDescription = (role: CmsRole): string => OPTION_BY_ROLE[role]?.description ?? '';

export const PRIMARY_CMS_ROLES = CMS_ROLE_OPTIONS.filter((o) => o.primary);

// Tailwind tone per role for badges — kept semantic, not just decorative.
export const CMS_ROLE_TONE: Record<CmsRole, string> = {
  cms_admin: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  cms_editor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  cms_publisher: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  cms_reviewer: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  cms_seo_manager: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  cms_author: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  cms_contributor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  cms_viewer: 'text-muted-foreground border-border bg-muted/40',
};

const PLATFORM_ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];

export interface CmsPermissions {
  /** Effective CMS role of the current user on this website (or null if not a member). */
  myRole: CmsRole | null;
  isManager: boolean; // can manage users + settings
  canReview: boolean; // can approve / reject
  canPublish: boolean; // can publish / schedule
  canEditContent: boolean;
  canManageMedia: boolean;
}

interface ResolveArgs {
  myRole: CmsRole | null;
  platformRole?: UserRole | null;
}

// A platform super_admin/owner/admin is treated as a CMS admin everywhere, even
// without an explicit website membership row.
export function resolveCmsPermissions({ myRole, platformRole }: ResolveArgs): CmsPermissions {
  const platformAdmin = !!platformRole && PLATFORM_ADMIN_ROLES.includes(platformRole);
  const level = myRole ? CMS_ROLE_LEVEL[myRole] : 0;
  const isManager = platformAdmin || level >= CMS_ROLE_LEVEL.cms_admin;

  return {
    myRole,
    isManager,
    canReview: isManager || level >= CMS_ROLE_LEVEL.cms_reviewer,
    canPublish: isManager || level >= CMS_ROLE_LEVEL.cms_publisher,
    canEditContent: isManager || level >= CMS_ROLE_LEVEL.cms_author,
    canManageMedia: isManager || level >= CMS_ROLE_LEVEL.cms_author,
  };
}
