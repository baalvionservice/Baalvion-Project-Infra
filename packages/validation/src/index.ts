import { z } from 'zod';
import { AppError } from '@baalvion/errors';
import type { Request, Response, NextFunction } from 'express';

export { z };

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(200).optional(),
  orgName:  z.string().min(1).max(200).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const mfaChallengeSchema = z.object({
  challengeToken: z.string().min(1),
  code:           z.string().length(6).regex(/^\d{6}$/),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token:       z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

// ─── Profile schemas ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  fullName:  z.string().min(1).max(200).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(128),
});

// ─── Org schemas ──────────────────────────────────────────────────────────────

export const createOrgSchema = z.object({
  name: z.string().min(2).max(200),
});

export const inviteMemberSchema = z.object({
  email: z.string().email().toLowerCase(),
  role:  z.enum(['admin', 'manager', 'editor', 'member', 'viewer']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role:         z.enum(['admin', 'manager', 'editor', 'member', 'viewer']).optional(),
  serviceRoles: z.record(z.array(z.string())).optional(),
});

export const acceptInviteSchema = z.object({
  token:    z.string().min(1),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(200).optional(),
});

// ─── OAuth schemas ────────────────────────────────────────────────────────────

export const oauthAuthorizeSchema = z.object({
  client_id:             z.string().min(1),
  redirect_uri:          z.string().url(),
  response_type:         z.enum(['code', 'token']),
  scope:                 z.string().default('openid profile email'),
  state:                 z.string().optional(),
  code_challenge:        z.string().optional(),
  code_challenge_method: z.enum(['S256', 'plain']).optional(),
});

export const oauthTokenSchema = z.discriminatedUnion('grant_type', [
  z.object({
    grant_type:    z.literal('authorization_code'),
    code:          z.string().min(1),
    redirect_uri:  z.string().url(),
    client_id:     z.string().min(1),
    client_secret: z.string().optional(),
    code_verifier: z.string().optional(),
  }),
  z.object({
    grant_type:    z.literal('client_credentials'),
    client_id:     z.string().min(1),
    client_secret: z.string().min(1),
    scope:         z.string().optional(),
  }),
  z.object({
    grant_type:    z.literal('refresh_token'),
    refresh_token: z.string().min(1),
    client_id:     z.string().min(1),
    client_secret: z.string().optional(),
  }),
]);

export const createOAuthClientSchema = z.object({
  name:           z.string().min(1).max(100),
  redirectUris:   z.array(z.string().url()).min(1).max(10),
  scopes:         z.array(z.string()).default(['openid', 'profile', 'email']),
  grantTypes:     z.array(z.enum(['authorization_code', 'client_credentials', 'refresh_token'])).min(1),
  isConfidential: z.boolean().default(true),
});

// ─── API Key schemas ──────────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name:        z.string().min(1).max(100),
  scopes:      z.array(z.string()).min(1),
  environment: z.enum(['live', 'test']).default('live'),
  expiresAt:   z.string().datetime().optional(),
});

// ─── Feature flag schemas ─────────────────────────────────────────────────────

export const createFlagSchema = z.object({
  key:     z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/),
  name:    z.string().min(1).max(200),
  enabled: z.boolean().default(false),
  rollout: z.number().min(0).max(100).default(0),
  targeting: z.object({
    userIds:    z.array(z.string()).optional(),
    orgIds:     z.array(z.string()).optional(),
    attributes: z.record(z.union([z.string(), z.array(z.string())])).optional(),
  }).default({}),
  orgId: z.string().uuid().nullable().optional(),
});

export const updateFlagSchema = createFlagSchema.partial();

// ─── Middleware factory ───────────────────────────────────────────────────────

export function validate<T extends z.ZodTypeAny>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new AppError('VALIDATION_ERROR', 'Invalid input', 400, result.error.flatten()));
      return;
    }
    if (source === 'body') req.body = result.data;
    next();
  };
}

// Common pagination schema
export const paginationSchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export type RegisterInput      = z.infer<typeof registerSchema>;
export type LoginInput         = z.infer<typeof loginSchema>;
export type MfaChallengeInput  = z.infer<typeof mfaChallengeSchema>;
export type CreateOrgInput     = z.infer<typeof createOrgSchema>;
export type InviteMemberInput  = z.infer<typeof inviteMemberSchema>;
export type CreateApiKeyInput  = z.infer<typeof createApiKeySchema>;
export type CreateFlagInput    = z.infer<typeof createFlagSchema>;
