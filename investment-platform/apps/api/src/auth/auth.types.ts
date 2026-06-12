import type { MembershipRole } from '@baalvion-invest/database';

/** Claims embedded in the short-lived RS256 access token. */
export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  orgId: string;
  role: MembershipRole;
  type: 'access';
}

/** Issued after password step when MFA is required, before the TOTP step. */
export interface MfaChallengePayload {
  sub: string;
  type: 'mfa_challenge';
}

/** Shape attached to `request.user` by the JWT strategy. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  orgId: string;
  role: MembershipRole;
}

/** Request metadata captured for session/audit purposes. */
export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type LoginResult =
  | { mfaRequired: true; challengeToken: string }
  | ({ mfaRequired: false } & TokenPair);
