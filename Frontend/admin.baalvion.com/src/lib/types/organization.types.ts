import type { UserRole } from './auth.types';

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl: string | null;
  memberCount: number;
  status: 'active' | 'suspended';
  createdAt: string;
  owner: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface OrgDetail extends OrgSummary {
  description?: string;
  website?: string;
  industry?: string;
  country?: string;
  teamMembers: OrgMember[];
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
}

export interface OrgMember {
  id: number;
  userId: number;
  orgId: string;
  role: UserRole;
  serviceRoles: Record<string, string>;
  joinedAt: string;
  status: 'active' | 'pending' | 'removed';
  user: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  createdBy: {
    id: number;
    email: string;
    fullName: string;
  };
}

export interface CreateOrgPayload {
  name: string;
  slug: string;
  plan?: string;
  description?: string;
  website?: string;
  industry?: string;
  country?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: UserRole;
}

export interface UpdateMemberRolePayload {
  role: UserRole;
  serviceRoles?: Record<string, string>;
}
