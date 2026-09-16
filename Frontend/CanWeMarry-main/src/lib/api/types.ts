/**
 * The wire contract with canwemarry-service.
 *
 * This file and `client.ts` import nothing from Next.js or from the DOM, so the pair can be
 * lifted into a shared package for the Expo application without modification. That is the
 * whole reason the API layer is separated from the components: React Native has no
 * `next/headers` and no relative-URL fetch, but it has the same JSON contract.
 *
 * These are the shapes a client is ALLOWED to see. The server decides which of them it
 * returns — a case arrives as CaseSummary or CaseDetail depending on the caller's
 * relationship to it, and the client cannot widen that by asking differently.
 */

export type Visibility = 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';
export type CaseStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type ModerationState = 'VISIBLE' | 'UNDER_REVIEW' | 'HIDDEN' | 'REMOVED';
export type ViewLevel = 'SUMMARY' | 'PARTICIPANT' | 'INTERNAL';

export type Role = 'USER' | 'SUPPORTER' | 'VOLUNTEER' | 'MODERATOR' | 'ADMIN';

export type SupportNeed =
  | 'LISTENING' | 'MEDIATION' | 'LEGAL' | 'COUNSELLING' | 'COMMUNITY' | 'PRACTICAL' | 'OTHER';

export type ConsentStatus = 'SELF' | 'INVITED' | 'GRANTED' | 'DECLINED' | 'WITHDRAWN';
export type Relation =
  | 'SELF' | 'PARTNER' | 'FAMILY_MEMBER' | 'MEDIATOR' | 'LEGAL_ADVISOR' | 'COUNSELLOR' | 'OTHER';

export interface Participant {
  id: string;
  caseId: string;
  relation: Relation;
  consentStatus: ConsentStatus;
  /** Null until the person has consented — see the service's domain/consent.js. */
  userId: string | null;
  isSelf: boolean;
  invitedAt: string;
  respondedAt: string | null;
}

export interface CaseSummary {
  id: string;
  reference: string;
  title: string;
  summary: string;
  supportNeeded: SupportNeed[];
  visibility: Visibility;
  status: CaseStatus;
  countryCode: string | null;
  region: string | null;
  communityId: string | null;
  supporterCount: number;
  commentCount: number;
  isLocked: boolean;
  allowSupporterRequests: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  viewLevel: ViewLevel;
}

/** Returned only to people inside a case. `situation` never appears at SUMMARY level. */
export interface CaseDetail extends CaseSummary {
  situation: string | null;
  ownerId: string;
  moderationState: ModerationState;
  participants: Participant[];
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  purpose: string | null;
  rules: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  joinPolicy: 'OPEN' | 'REQUEST' | 'INVITE';
  countryCode: string | null;
  region: string | null;
  isMember: boolean;
  /**
   * The VIEWER'S OWN membership, never anybody else's. NONE / PENDING / ACTIVE — a request
   * awaiting approval is PENDING, so the UI can say so instead of showing a stranger's view
   * of a place somebody has already asked to join.
   */
  membershipStatus: 'NONE' | 'PENDING' | 'ACTIVE';
  /**
   * The viewer's role in this community, or null. Presentation only: it decides whether a
   * management surface is drawn, and every management route re-checks server-side.
   */
  myRole: 'MEMBER' | 'MODERATOR' | 'ADMIN' | null;
  /** Real counts from the server, never estimates. */
  memberCount: number;
  postCount: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  category: 'LEGAL' | 'MEDIATION' | 'COUNSELLING' | 'SAFETY' | 'RIGHTS' | 'FINANCIAL' | 'OTHER';
  countryCode: string | null;
  region: string | null;
  url: string | null;
  providerName: string | null;
  isPublished: boolean;
  publishedAt: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Profile {
  userId: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  region: string | null;
  languages: string[];
  isDiscoverable: boolean;
  showLocation: boolean;
  defaultCaseVisibility: Visibility;
  createdAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: Pagination;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, string[]>;
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// ── Added for the full application surface ───────────────────────────────────

/** The caller's own identity, from GET /me. Presentation only — routes enforce their own. */
export interface Identity {
  /** False for a visitor with no session — a normal answer, not an error. */
  authenticated: boolean;
  userId: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | null;
  roles: Role[];
  primaryRole: Role | null;
  permissions: string[];
  /**
   * Email-verification state as the SERVER knows it. `UNKNOWN` is the honest answer today:
   * auth-service does not emit the claim, so the app must not render a "Verified" badge.
   * Null for an anonymous caller.
   */
  emailVerification: { state: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN'; enforced: boolean } | null;
  profile: Profile | null;
}

export interface CaseUpdate {
  id: string;
  caseId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type SupporterStatus = 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'REVOKED';

export interface Supporter {
  id: string;
  caseId: string;
  userId: string;
  status: SupporterStatus;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface Comment {
  id: string;
  targetType: 'CASE' | 'POST';
  targetId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  moderationState: ModerationState;
  createdAt: string;
  updatedAt: string;
}

export type ReactionKind = 'SUPPORT' | 'THANKS' | 'HELPFUL';

export interface ReactionSummary {
  counts: Partial<Record<ReactionKind, number>>;
  mine: ReactionKind | null;
}

/** A resource as it appears in a list: no body, so a related panel stays small. */
export interface ResourceCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: Resource['category'];
  countryCode: string | null;
  providerName: string | null;
  url: string | null;
}

/**
 * Material related to a case.
 *
 * There is deliberately no `reason` on any of these: why two cases sit next to each other is
 * itself a fact about both of them, and not one either owner agreed to publish.
 */
export interface RelatedContent {
  resources: ResourceCard[];
  communities: Community[];
  cases: CaseSummary[];
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'BANNED' | 'LEFT';
  joinedAt: string | null;
}

export interface Post {
  id: string;
  /** Set once the author deletes it; the title and body are overwritten at the same time. */
  deletedAt?: string | null;
  communityId: string;
  authorId: string;
  title: string;
  body: string;
  isLocked: boolean;
  commentCount: number;
  moderationState: ModerationState;
  createdAt: string;
  updatedAt: string;
}

export type ReportReason =
  | 'HARASSMENT' | 'THREAT_OR_VIOLENCE' | 'PRIVACY_VIOLATION' | 'IMPERSONATION'
  | 'SPAM' | 'HATE_SPEECH' | 'SELF_HARM_RISK' | 'COERCION' | 'OFF_TOPIC' | 'OTHER';

export interface Report {
  id: string;
  /**
   * How many separate people reported this target. Deliberately a count: who complained is
   * not something a moderator needs in order to judge whether content breaks the rules, and
   * naming them would expose the person who spoke up. Present on the detail view only.
   */
  reportsOnTarget?: number;
  targetType: string;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'TRIAGED' | 'ACTIONED' | 'DISMISSED';
  assignedTo: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ModerationActionRecord {
  id: string;
  actorId: string | null;
  reportId: string | null;
  targetType: string;
  targetId: string;
  action: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  status: string;
  suspendedUntil: string | null;
  roles: Role[];
  handle: string | null;
  displayName: string | null;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorRoles: string[];
  action: string;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}


// ── Shareable invitations ────────────────────────────────────────────────────

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED' | 'EXPIRED';

/** The owner's view. Never carries the code, and never says who holds it. */
export interface Invitation {
  id: string;
  caseId: string;
  relation: Relation;
  status: InvitationStatus;
  accepted: boolean;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
}

/** Returned exactly once, at creation. `token` is never retrievable again. */
export interface MintedInvitation extends Invitation {
  token: string;
}

/**
 * What a code-holder sees before deciding. Deliberately carries no case id, title, summary
 * or owner — the code may have travelled further than the owner intended.
 */
export interface InvitationPreview {
  relation: Relation;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

/** A reporter's view of their own report: the outcome, never the moderator or their notes. */
export interface ReporterReport {
  id: string;
  targetType: string;
  reason: ReportReason;
  status: 'OPEN' | 'TRIAGED' | 'ACTIONED' | 'DISMISSED';
  resolvedAt: string | null;
  createdAt: string;
}


// ── Operations ───────────────────────────────────────────────────────────────
// Everything below is an AGGREGATE. None of these types carries a case title, a participant,
// a community membership or an email address, and none of the endpoints behind them accepts
// an identifier — there is nothing on which to hang a per-person view later.

/** Queue health. `oldestOpenHours` is the number that says whether the queue is safe. */
export interface QueueHealth {
  open: number;
  triaged: number;
  awaiting: number;
  critical: number;
  resolvedLast7Days: number;
  oldestOpenHours: number | null;
}

/**
 * A suspension, reported as the platform actually enforces it.
 *
 * `storedStatus` is the column; `effectiveState` is what the authentication middleware does
 * about it. They diverge whenever a suspension has expired, because nothing rewrites the
 * column — so the second is the one to show.
 */
export interface SuspensionRecord {
  userId: string;
  storedStatus: string;
  effectiveState: 'ACTIVE' | 'EXPIRED';
  expiresAt: string | null;
  indefinite: boolean;
  appliedAt: string;
}

/** A decision, without who made it — accountability lives in the moderation log. */
export interface RecentAction {
  action: string;
  targetType: string;
  at: string;
}

export interface OperationsSummary {
  queue: QueueHealth;
  suspensions: { active: number; expiredButNotCleared: number; items: SuspensionRecord[] };
  recentActions: RecentAction[];
  awaitingByReason: { reason: string; severity: string; count: number }[];
}

export interface Analytics {
  window: { key: string; label: string; since: string; timezone: string };
  users: { registered: number; active: number; suspended: number; total: number };
  cases: { created: number; opened: number; draft: number; resolved: number; closed: number; underReview: number };
  support: { offered: number; accepted: number; withdrawn: number; perOpenCase: number };
  community: { total: number; memberships: number; posts: number; comments: number; withActivity: number };
  safety: {
    reports: number; open: number; resolved: number; critical: number; actions: number;
    medianResolutionHours: number | null;
    oldestOpenHours: number | null;
  };
  reportsByReason: { reason: string; count: number }[];
  /** Shipped with the numbers, so a label can never drift from what was computed. */
  definitions: Record<string, string>;
  windows: { key: string; label: string }[];
}

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';

export interface HealthCheck {
  key: string;
  label: string;
  state: HealthState;
  latencyMs: number | null;
  detail: string | null;
}

export interface PlatformHealth {
  overall: HealthState;
  checkedAt: string;
  checks: HealthCheck[];
}

/** Read-only. These come from the environment; there is deliberately no write path. */
export interface ConfigurationItem {
  key: string;
  label: string;
  enabled: boolean;
  summary: string;
  changedBy: string;
}

/** A member's own request for supporter or volunteer standing. */
export interface RoleRequest {
  id: string;
  role: 'SUPPORTER' | 'VOLUNTEER';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

/**
 * The same request as a moderator sees it. The applicant's `reason` is their own account of
 * their own family — it is read here and nowhere else in the product.
 */
export interface RoleRequestReview extends RoleRequest {
  applicant: {
    id: string;
    handle: string | null;
    displayName: string | null;
    status: string;
    memberSince: string;
    roles: string[];
  } | null;
}
