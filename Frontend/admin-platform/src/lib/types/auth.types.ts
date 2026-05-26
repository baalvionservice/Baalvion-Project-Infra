export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'member'
  | 'viewer'
  | 'support'
  | 'developer'
  | 'analyst'
  | 'finance'
  | 'moderator'
  | 'readonly';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: 'active' | 'suspended' | 'pending';
  emailVerifiedAt: string | null;
  mfaEnabled: boolean;
  role: UserRole;
  orgId: string | null;
  permissions: string[];
  sessionId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  ownerId: number;
  logoUrl: string | null;
  createdAt: string;
  memberCount: number;
  status: 'active' | 'suspended';
  owner: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface TeamMember {
  id: number;
  orgId: string;
  userId: number;
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

export interface AuthTokens {
  accessToken: string;
  expiresAt: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  org: Organization | null;
  accessToken: string;
  expiresIn: number;
  mfaRequired?: boolean;
  tempToken?: string;
}

export interface MfaVerifyPayload {
  code: string;
  tempToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
