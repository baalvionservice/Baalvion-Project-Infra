export interface NavItem {
  href: string;
  label: string;
  /** Permission the caller must hold for the link to render. Presentation only. */
  permission?: string;
}

/** Always visible, signed in or not. */
export const PUBLIC_NAV: NavItem[] = [
  { href: '/guides', label: 'Guides' },
  { href: '/cases', label: 'Explore cases' },
  { href: '/community', label: 'Community' },
  { href: '/resources', label: 'Resources' },
  { href: '/safety', label: 'Safety' },
  { href: '/about', label: 'About' },
];

/** Shown once a session exists. */
export const ACCOUNT_NAV: NavItem[] = [
  { href: '/my-cases', label: 'My cases' },
  { href: '/invitations', label: 'Invitations' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
];

/**
 * Staff entry point. `report:review` is a moderator capability; the admin-only screens
 * inside /admin gate themselves separately, so a moderator sees the section without
 * being offered the parts they cannot reach.
 */
export const STAFF_NAV: NavItem[] = [
  { href: '/moderation', label: 'Moderation', permission: 'report:review' },
  { href: '/admin', label: 'Admin', permission: 'admin:users' },
];

export const MODERATION_NAV: NavItem[] = [
  { href: '/moderation', label: 'Overview', permission: 'report:review' },
  { href: '/moderation/queue', label: 'Report queue', permission: 'report:review' },
  // Gated on the grant capability rather than report:review, matching the route: approving a
  // request IS a role grant, and a reviewer who could not grant must not see a queue of
  // decisions they cannot make.
  { href: '/moderation/requests', label: 'Standing requests', permission: 'user:role_grant' },
  { href: '/moderation/suspensions', label: 'Suspensions', permission: 'admin:moderation' },
  { href: '/moderation/history', label: 'Action history', permission: 'admin:moderation' },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/analytics', label: 'Analytics', permission: 'admin:audit' },
  { href: '/admin/platform', label: 'Platform', permission: 'admin:audit' },
  { href: '/admin/users', label: 'Users', permission: 'admin:users' },
  { href: '/admin/cases', label: 'Cases', permission: 'case:moderate' },
  { href: '/admin/reports', label: 'Reports', permission: 'report:review' },
  { href: '/admin/moderation', label: 'Moderation log', permission: 'admin:moderation' },
  { href: '/admin/audit', label: 'Audit trail', permission: 'admin:audit' },
];
