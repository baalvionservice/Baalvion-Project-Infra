import { api } from './client';
import type { ClientOptions, Result } from './client';
import type {
  CaseDetail, CaseSummary, CaseUpdate, Comment, Community, CommunityMember, Identity,
  Invitation, InvitationPreview, MintedInvitation, Notification, Participant, Profile,
  ReactionSummary, RelatedContent, ReporterReport, Resource, RoleRequest, RoleRequestReview, Supporter,
  Analytics, ConfigurationItem, OperationsSummary, PlatformHealth,
} from './types';

/**
 * Named endpoints, so a page never assembles a URL by hand and a route change is a
 * one-line edit here rather than a search through the component tree.
 */
export const identity = {
  /** The caller as this product understands them: product roles and permissions. */
  me: (options?: ClientOptions): Promise<Result<Identity>> => api.get('/me', options),
};

export const cases = {
  byReference: (reference: string, options?: ClientOptions): Promise<Result<CaseDetail | CaseSummary>> =>
    api.get(`/cases/reference/${reference}`, options),

  list: (params: {
    page?: number; pageSize?: number; status?: string; visibility?: string;
    communityId?: string; countryCode?: string; mine?: boolean; supporting?: boolean;
    q?: string; sort?: string; supportNeeded?: string;
  } = {}, options?: ClientOptions): Promise<Result<CaseSummary[]>> =>
    api.get(`/cases${api.query(params)}`, options),

  get: (id: string, options?: ClientOptions): Promise<Result<CaseDetail | CaseSummary>> =>
    api.get(`/cases/${id}`, options),

  /**
   * Resources, communities and other cases worth looking at alongside this one.
   * Everything comes back under the caller's own visibility rules, and nothing says why it
   * was chosen.
   */
  related: (id: string, options?: ClientOptions): Promise<Result<RelatedContent>> =>
    api.get(`/cases/${id}/related`, options),

  getByReference: (reference: string, options?: ClientOptions): Promise<Result<CaseDetail | CaseSummary>> =>
    api.get(`/cases/reference/${reference}`, options),

  create: (input: unknown, options?: ClientOptions): Promise<Result<CaseDetail>> =>
    api.post('/cases', input, options),

  update: (id: string, input: unknown, options?: ClientOptions): Promise<Result<CaseDetail>> =>
    api.patch(`/cases/${id}`, input, options),

  remove: (id: string, options?: ClientOptions): Promise<Result<{ id: string; deleted: boolean }>> =>
    api.delete(`/cases/${id}`, undefined, options),

  // Participants and consent
  participants: (id: string, options?: ClientOptions): Promise<Result<Participant[]>> =>
    api.get(`/cases/${id}/participants`, options),

  invite: (id: string, input: { userId: string; relation: string }, options?: ClientOptions): Promise<Result<Participant>> =>
    api.post(`/cases/${id}/participants`, input, options),

  respondToInvitation: (id: string, participantId: string, decision: 'GRANTED' | 'DECLINED', options?: ClientOptions): Promise<Result<Participant>> =>
    api.post(`/cases/${id}/participants/${participantId}/respond`, { decision }, options),

  withdrawConsent: (id: string, participantId: string, options?: ClientOptions): Promise<Result<Participant>> =>
    api.post(`/cases/${id}/participants/${participantId}/withdraw`, undefined, options),

  // Support
  supporters: (id: string, options?: ClientOptions): Promise<Result<Supporter[]>> =>
    api.get(`/cases/${id}/supporters`, options),

  offerSupport: (id: string, message?: string, options?: ClientOptions): Promise<Result<Supporter>> =>
    api.post(`/cases/${id}/supporters`, { message }, options),

  decideSupport: (id: string, supporterId: string, decision: 'ACCEPTED' | 'DECLINED', options?: ClientOptions): Promise<Result<Supporter>> =>
    api.post(`/cases/${id}/supporters/${supporterId}/decide`, { decision }, options),

  withdrawSupport: (id: string, options?: ClientOptions): Promise<Result<Supporter>> =>
    api.post(`/cases/${id}/supporters/withdraw`, undefined, options),

  revokeSupporter: (id: string, supporterId: string, options?: ClientOptions): Promise<Result<Supporter>> =>
    api.delete(`/cases/${id}/supporters/${supporterId}`, undefined, options),

  // Shareable invitations
  invitations: (id: string, options?: ClientOptions): Promise<Result<Invitation[]>> =>
    api.get(`/cases/${id}/invitations`, options),

  createInvitation: (id: string, input: { relation: string; expiresInDays?: number }, options?: ClientOptions): Promise<Result<MintedInvitation>> =>
    api.post(`/cases/${id}/invitations`, input, options),

  revokeInvitation: (id: string, invitationId: string, options?: ClientOptions): Promise<Result<Invitation>> =>
    api.delete(`/cases/${id}/invitations/${invitationId}`, undefined, options),

  // Owner-authored updates
  updates: (id: string, params: { page?: number; pageSize?: number } = {}, options?: ClientOptions): Promise<Result<CaseUpdate[]>> =>
    api.get(`/cases/${id}/updates${api.query(params)}`, options),

  postUpdate: (id: string, body: string, options?: ClientOptions): Promise<Result<CaseUpdate>> =>
    api.post(`/cases/${id}/updates`, { body }, options),

  deleteUpdate: (id: string, updateId: string, options?: ClientOptions) =>
    api.delete(`/cases/${id}/updates/${updateId}`, undefined, options),
};

export const invitations = {
  /** Public: what a code-holder may see before deciding. Carries no case content. */
  preview: (token: string, options?: ClientOptions): Promise<Result<InvitationPreview>> =>
    api.get(`/invitations/${token}`, options),

  accept: (token: string, options?: ClientOptions): Promise<Result<{ caseId: string; participantId: string }>> =>
    api.post(`/invitations/${token}/accept`, undefined, options),

  decline: (token: string, options?: ClientOptions): Promise<Result<{ declined: boolean }>> =>
    api.post(`/invitations/${token}/decline`, undefined, options),

  /** Every invitation the caller has issued, across their cases. */
  sent: (options?: ClientOptions): Promise<Result<Invitation[]>> =>
    api.get('/me/invitations-sent', options),
};

export const communities = {
  list: (params: {
    page?: number; pageSize?: number; countryCode?: string;
    visibility?: string; q?: string; sort?: string;
  } = {}, options?: ClientOptions): Promise<Result<Community[]>> =>
    api.get(`/communities${api.query(params)}`, options),

  getBySlug: (slug: string, options?: ClientOptions): Promise<Result<Community>> =>
    api.get(`/communities/slug/${slug}`, options),

  /** By id — what a case names its community by. Same visibility rule as by-slug. */
  get: (id: string, options?: ClientOptions): Promise<Result<Community>> =>
    api.get(`/communities/${id}`, options),

  /** Name, description, purpose and rules. Community administrators only; the server checks. */
  update: (id: string, input: unknown, options?: ClientOptions): Promise<Result<Community>> =>
    api.patch(`/communities/${id}`, input, options),

  create: (input: unknown, options?: ClientOptions): Promise<Result<Community>> =>
    api.post('/communities', input, options),

  join: (id: string, options?: ClientOptions): Promise<Result<CommunityMember>> =>
    api.post(`/communities/${id}/join`, undefined, options),

  leave: (id: string, options?: ClientOptions): Promise<Result<CommunityMember>> =>
    api.post(`/communities/${id}/leave`, undefined, options),

  members: (id: string, params: { page?: number; pageSize?: number; status?: 'ACTIVE' | 'PENDING' } = {}, options?: ClientOptions): Promise<Result<CommunityMember[]>> =>
    api.get(`/communities/${id}/members${api.query(params)}`, options),

  // ── Membership management. Community moderators and administrators; the server checks
  // each one, and a community administrator is not a platform moderator. ──
  approveMember: (id: string, userId: string, options?: ClientOptions): Promise<Result<CommunityMember>> =>
    api.post(`/communities/${id}/members/${userId}/approve`, undefined, options),

  /** Turn down a pending request. The row goes, so they may ask again another time. */
  declineMember: (id: string, userId: string, options?: ClientOptions): Promise<Result<{ status: string }>> =>
    api.post(`/communities/${id}/members/${userId}/decline`, undefined, options),

  /** End a membership. Marks them as having left — it is not a ban. */
  removeMember: (id: string, userId: string, options?: ClientOptions): Promise<Result<CommunityMember>> =>
    api.delete(`/communities/${id}/members/${userId}`, undefined, options),
};

export const posts = {
  list: (params: { communityId: string; page?: number; pageSize?: number }, options?: ClientOptions) =>
    api.get(`/posts${api.query(params)}`, options),
  get: (id: string, options?: ClientOptions) => api.get(`/posts/${id}`, options),
  create: (input: { communityId: string; title: string; body: string }, options?: ClientOptions) =>
    api.post('/posts', input, options),
  update: (id: string, input: { title?: string; body?: string }, options?: ClientOptions) =>
    api.patch(`/posts/${id}`, input, options),
  remove: (id: string, options?: ClientOptions) => api.delete(`/posts/${id}`, undefined, options),
};

export const comments = {
  list: (params: { targetType: 'CASE' | 'POST'; targetId: string; page?: number; pageSize?: number }, options?: ClientOptions): Promise<Result<Comment[]>> =>
    api.get(`/comments${api.query(params)}`, options),

  create: (input: { targetType: 'CASE' | 'POST'; targetId: string; parentId?: string; body: string }, options?: ClientOptions): Promise<Result<Comment>> =>
    api.post('/comments', input, options),

  update: (id: string, body: string, options?: ClientOptions): Promise<Result<Comment>> =>
    api.patch(`/comments/${id}`, { body }, options),

  remove: (id: string, options?: ClientOptions) => api.delete(`/comments/${id}`, undefined, options),
};

export const reactions = {
  summary: (targetType: string, targetId: string, options?: ClientOptions): Promise<Result<ReactionSummary>> =>
    api.get(`/reactions/${targetType}/${targetId}`, options),

  set: (input: { targetType: string; targetId: string; kind: string }, options?: ClientOptions) =>
    api.put('/reactions', input, options),

  clear: (targetType: string, targetId: string, options?: ClientOptions) =>
    api.delete(`/reactions/${targetType}/${targetId}`, undefined, options),
};

export const resources = {
  list: (params: { page?: number; pageSize?: number; category?: string; countryCode?: string } = {}, options?: ClientOptions): Promise<Result<Resource[]>> =>
    api.get(`/resources${api.query(params)}`, options),

  getBySlug: (slug: string, options?: ClientOptions): Promise<Result<Resource>> =>
    api.get(`/resources/${slug}`, options),

  create: (input: unknown, options?: ClientOptions): Promise<Result<Resource>> =>
    api.post('/resources', input, options),

  update: (id: string, input: unknown, options?: ClientOptions): Promise<Result<Resource>> =>
    api.patch(`/resources/${id}`, input, options),
};

export const profiles = {
  byHandle: (handle: string, options?: ClientOptions): Promise<Result<Partial<Profile>>> =>
    api.get(`/profiles/${handle}`, options),
};

export const me = {
  profile: (options?: ClientOptions): Promise<Result<Profile | null>> => api.get('/me/profile', options),
  saveProfile: (input: unknown, options?: ClientOptions): Promise<Result<Profile>> => api.put('/me/profile', input, options),

  notifications: (params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}, options?: ClientOptions): Promise<Result<Notification[]>> =>
    api.get(`/me/notifications${api.query(params)}`, options),
  unreadCount: (options?: ClientOptions): Promise<Result<{ unread: number }>> =>
    api.get('/me/notifications/unread-count', options),
  markRead: (id: string, options?: ClientOptions) => api.post(`/me/notifications/${id}/read`, undefined, options),
  markAllRead: (options?: ClientOptions) => api.post('/me/notifications/read-all', undefined, options),

  /**
   * Standing. Offering support is not a capability a new account holds, so this is how
   * somebody asks for it — see the service for why it is not simply granted on sign-up.
   */
  roleRequests: (options?: ClientOptions): Promise<Result<RoleRequest[]>> => api.get('/me/role-requests', options),
  requestRole: (input: { role: 'SUPPORTER' | 'VOLUNTEER'; reason: string }, options?: ClientOptions): Promise<Result<RoleRequest>> =>
    api.post('/me/role-requests', input, options),
  withdrawRoleRequest: (id: string, options?: ClientOptions) =>
    api.post(`/me/role-requests/${id}/withdraw`, undefined, options),

  invitations: (options?: ClientOptions): Promise<Result<Participant[]>> => api.get('/me/invitations', options),
  reports: (params: { page?: number; pageSize?: number } = {}, options?: ClientOptions): Promise<Result<ReporterReport[]>> =>
    api.get(`/me/reports${api.query(params)}`, options),
};

export const reports = {
  create: (input: { targetType: string; targetId: string; reason: string; details?: string }, options?: ClientOptions) =>
    api.post('/reports', input, options),
};

export const moderation = {
  queue: (params: {
    page?: number; pageSize?: number; status?: string; severity?: string;
    reason?: string; targetType?: string; unresolved?: boolean; sort?: string;
  } = {}, options?: ClientOptions) =>
    api.get(`/moderation/reports${api.query(params)}`, options),

  /** Queue health, suspensions in force and recent decisions. Counts and types only. */
  summary: (options?: ClientOptions): Promise<Result<OperationsSummary>> =>
    api.get('/moderation/summary', options),
  report: (id: string, options?: ClientOptions) => api.get(`/moderation/reports/${id}`, options),
  review: (id: string, input: { status: string; severity?: string; resolutionNote?: string }, options?: ClientOptions) =>
    api.post(`/moderation/reports/${id}/review`, input, options),
  act: (input: { targetType: string; targetId: string; action: string; reason: string; expiresAt?: string }, options?: ClientOptions) =>
    api.post('/moderation/actions', input, options),
  history: (params: { page?: number; pageSize?: number; targetType?: string; targetId?: string } = {}, options?: ClientOptions) =>
    api.get(`/moderation/actions${api.query(params)}`, options),

  /** People asking to become supporters or volunteers. Oldest wait first, server-side. */
  roleRequests: (params: { page?: number; pageSize?: number; status?: string } = {}, options?: ClientOptions): Promise<Result<RoleRequestReview[]>> =>
    api.get(`/moderation/role-requests${api.query(params)}`, options),
  decideRoleRequest: (id: string, input: { approve: boolean; note?: string }, options?: ClientOptions) =>
    api.post(`/moderation/role-requests/${id}/decide`, input, options),
};

export const admin = {
  users: (params: { page?: number; pageSize?: number; status?: string } = {}, options?: ClientOptions) =>
    api.get(`/admin/users${api.query(params)}`, options),
  grantRole: (userId: string, role: string, options?: ClientOptions) =>
    api.post(`/admin/users/${userId}/roles`, { role }, options),
  revokeRole: (userId: string, role: string, options?: ClientOptions) =>
    api.delete(`/admin/users/${userId}/roles`, { role }, options),
  cases: (params: { page?: number; pageSize?: number; status?: string } = {}, options?: ClientOptions) =>
    api.get(`/admin/cases${api.query(params)}`, options),
  audit: (params: { page?: number; pageSize?: number; action?: string; entityType?: string } = {}, options?: ClientOptions) =>
    api.get(`/admin/audit${api.query(params)}`, options),

  /** Aggregated product health for one window. Administrator-only; no per-person breakdown exists. */
  analytics: (params: { window?: string } = {}, options?: ClientOptions): Promise<Result<Analytics>> =>
    api.get(`/admin/analytics${api.query(params)}`, options),

  /** Whether each dependency answered. No connection detail is returned. */
  health: (options?: ClientOptions): Promise<Result<PlatformHealth>> =>
    api.get('/admin/health', options),

  /** Configuration that changes what the product does. Read-only by design. */
  configuration: (options?: ClientOptions): Promise<Result<{ items: ConfigurationItem[] }>> =>
    api.get('/admin/configuration', options),
};

export { api } from './client';
export type { ApiError, ClientOptions, Result } from './client';
export type * from './types';
