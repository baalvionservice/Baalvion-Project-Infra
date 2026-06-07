import type { UserRole } from '@/lib/types/auth.types';

/**
 * Maps a platform UserRole to an onboarding "persona" used by the post-login
 * welcome experience: a human-facing role name, a division, a professional
 * congratulatory message, and an accent identity.
 */
export interface RoleWelcome {
  /** Human-facing role name shown in "Welcome back, {roleName}". */
  roleName: string;
  /** Division / mission area chip. */
  division: string;
  /** Professional, corporate congratulatory line. */
  message: string;
  /** lucide-react icon name rendered in the halo. */
  icon: 'ShieldCheck' | 'Landmark' | 'Activity' | 'Cpu' | 'Scale' | 'Handshake' | 'UserRound';
  /** Status line under the greeting. */
  clearance: string;
}

const ADMINISTRATION: Omit<RoleWelcome, 'roleName'> = {
  division: 'Mission Control',
  message:
    'Full command of the Baalvion platform is restored to you. Every market, every system, every team — unified under one console.',
  icon: 'ShieldCheck',
  clearance: 'Clearance · Tier 0 — Global',
};

const ROLE_MAP: Record<UserRole, RoleWelcome> = {
  super_admin: { roleName: 'Super Administrator', ...ADMINISTRATION },
  owner: {
    roleName: 'Proprietor',
    division: 'Executive Office',
    message:
      'The enterprise stands ready. Capital, operations, and intelligence are aligned and reporting to you.',
    icon: 'ShieldCheck',
    clearance: 'Clearance · Tier 0 — Executive',
  },
  admin: { roleName: 'Administrator', ...ADMINISTRATION, division: 'Administration', clearance: 'Clearance · Tier 1 — Platform' },
  moderator: {
    roleName: 'Compliance Officer',
    division: 'Governance & Trust',
    message:
      'Governance, audit, and risk controls are active. The integrity of the enterprise rests in steady hands.',
    icon: 'Scale',
    clearance: 'Clearance · Tier 2 — Controls',
  },
  manager: {
    roleName: 'Operations Lead',
    division: 'Global Operations',
    message:
      'Worldwide operations are synchronized and running nominal. The network is yours to orchestrate.',
    icon: 'Activity',
    clearance: 'Clearance · Tier 2 — Operations',
  },
  finance: {
    roleName: 'Finance Controller',
    division: 'Finance & Capital',
    message:
      'Treasury, settlement, and capital-flow intelligence are live. The numbers are ready for your review.',
    icon: 'Landmark',
    clearance: 'Clearance · Tier 2 — Capital',
  },
  analyst: {
    roleName: 'Financial Analyst',
    division: 'Finance & Capital',
    message:
      'Market signals and capital dashboards are streaming in real time. Insight is a keystroke away.',
    icon: 'Landmark',
    clearance: 'Clearance · Tier 3 — Capital',
  },
  developer: {
    roleName: 'Engineering Lead',
    division: 'Engineering & Infrastructure',
    message:
      'All infrastructure and AI systems report nominal. Build boldly — the platform is yours to extend.',
    icon: 'Cpu',
    clearance: 'Clearance · Tier 2 — Infrastructure',
  },
  editor: {
    roleName: 'Content Lead',
    division: 'Communications',
    message:
      'The publishing and content systems are open. The enterprise narrative is in your hands.',
    icon: 'UserRound',
    clearance: 'Clearance · Tier 3 — Editorial',
  },
  support: {
    roleName: 'Partner Success',
    division: 'Partners & Support',
    message:
      'Your partnership gateway is open. Shared markets and joint operations await your stewardship.',
    icon: 'Handshake',
    clearance: 'Clearance · Tier 3 — Partners',
  },
  member: {
    roleName: 'Team Member',
    division: 'Operations',
    message: 'Your workspace is ready. Welcome back to the Baalvion platform.',
    icon: 'UserRound',
    clearance: 'Clearance · Tier 4 — Member',
  },
  viewer: {
    roleName: 'Observer',
    division: 'Read-only Access',
    message: 'Your read-only console is ready. The full picture, at a glance.',
    icon: 'UserRound',
    clearance: 'Clearance · Tier 5 — Observer',
  },
  readonly: {
    roleName: 'Observer',
    division: 'Read-only Access',
    message: 'Your read-only console is ready. The full picture, at a glance.',
    icon: 'UserRound',
    clearance: 'Clearance · Tier 5 — Observer',
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
