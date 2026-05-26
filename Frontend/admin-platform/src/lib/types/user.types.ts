import type { UserRole } from './auth.types';

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: 'active' | 'suspended' | 'pending';
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  role: UserRole;
  orgCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends AdminUser {
  orgs: Array<{
    id: string;
    name: string;
    slug: string;
    role: UserRole;
    joinedAt: string;
  }>;
  sessions: Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    lastSeenAt: string;
    createdAt: string;
  }>;
  auditSummary: {
    totalActions: number;
    lastAction: string | null;
  };
}

export interface UpdateUserPayload {
  fullName?: string;
  avatarUrl?: string;
  status?: 'active' | 'suspended';
  role?: UserRole;
}

export interface SuspendUserPayload {
  reason: string;
  duration?: number;
}
