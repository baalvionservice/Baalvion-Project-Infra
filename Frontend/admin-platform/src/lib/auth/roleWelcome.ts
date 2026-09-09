import type { UserRole } from '@/lib/types/auth.types';

/**
 * Maps a platform UserRole to the post-login session summary: a human-facing role
 * name, the area of the business it belongs to, what the account can reach, and a
 * plain statement of what that means. Deliberately factual — this screen is the
 * first thing an operator sees, so it states access, not atmosphere.
 */
export interface RoleWelcome {
  /** Human-facing role name, e.g. "Super Administrator". */
  roleName: string;
  /** Area of the business the role sits in. */
  division: string;
  /** What the account reaches, in a few words. */
  access: string;
  /** One plain sentence on what the access means. */
  message: string;
}

const ROLE_MAP: Record<UserRole, RoleWelcome> = {
  super_admin: {
    roleName: 'Super Administrator',
    division: 'Platform Administration',
    access: 'Every site and business',
    message:
      'You have platform-wide access. Changes made here apply across every Baalvion site and business.',
  },
  owner: {
    roleName: 'Owner',
    division: 'Executive',
    access: 'Organisation-wide',
    message:
      'Your organisation’s accounts, operations and reporting are available in one place.',
  },
  admin: {
    roleName: 'Administrator',
    division: 'Platform Administration',
    access: 'Granted sites and businesses',
    message:
      'Your access covers the sites and businesses granted to your account.',
  },
  moderator: {
    roleName: 'Compliance Officer',
    division: 'Governance & Trust',
    access: 'Audit and controls',
    message: 'Audit trails, reviews and regulatory controls are available for sign-off.',
  },
  manager: {
    roleName: 'Operations Lead',
    division: 'Operations',
    access: 'Operational systems',
    message: 'Fulfilment, inventory and day-to-day operations are available to manage.',
  },
  finance: {
    roleName: 'Finance Controller',
    division: 'Finance & Capital',
    access: 'Treasury and settlement',
    message: 'Treasury, settlement and payment records are ready for review.',
  },
  analyst: {
    roleName: 'Financial Analyst',
    division: 'Finance & Capital',
    access: 'Reporting and analytics',
    message: 'Capital and market reporting is available for review.',
  },
  compliance: {
    roleName: 'Compliance Officer',
    division: 'Governance & Trust',
    access: 'Audit and compliance',
    message: 'Compliance reviews, audit trails and regulatory controls are available.',
  },
  developer: {
    roleName: 'Engineering Lead',
    division: 'Engineering & Infrastructure',
    access: 'Infrastructure and integrations',
    message: 'Service health, integrations and developer tooling are available.',
  },
  editor: {
    roleName: 'Content Lead',
    division: 'Editorial',
    access: 'Granted publications',
    message: 'Publishing tools for the sites granted to your account are available.',
  },
  support: {
    roleName: 'Partner Success',
    division: 'Partners & Support',
    access: 'Partner accounts',
    message: 'Partner accounts and support queues are available to you.',
  },
  member: {
    roleName: 'Team Member',
    division: 'Operations',
    access: 'Your workspace',
    message: 'Your workspace is ready.',
  },
  viewer: {
    roleName: 'Observer',
    division: 'Read-only Access',
    access: 'Read-only',
    message: 'You have read-only access to the console.',
  },
  readonly: {
    roleName: 'Observer',
    division: 'Read-only Access',
    access: 'Read-only',
    message: 'You have read-only access to the console.',
  },
};

const DEFAULT_WELCOME: RoleWelcome = ROLE_MAP.member;

export function getRoleWelcome(role: UserRole | null | undefined): RoleWelcome {
  if (!role) return DEFAULT_WELCOME;
  return ROLE_MAP[role] ?? DEFAULT_WELCOME;
}

/** Time-of-day greeting prefix — "Good morning" etc. */
export function getTimeGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Welcome back';
}

/** First name from a full name, for a warmer greeting. */
export function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] ?? '';
}
