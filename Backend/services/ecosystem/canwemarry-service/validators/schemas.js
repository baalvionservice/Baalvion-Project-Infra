'use strict';
const { z } = require('zod');
const config = require('../config/appConfig');
const { ALL_ROLES } = require('../domain/roles');
const { ALL_RELATIONS, CONSENT } = require('../domain/consent');

// Zod strips unknown keys by default, so a payload can only ever set the fields declared
// here. That is what stops a client from posting `moderation_state` or `owner_id` into a
// create call and having Sequelize happily persist it.

const uuid = z.string().uuid();
const countryCode = z.string().length(2).regex(/^[A-Za-z]{2}$/, 'Use a two-letter country code');
const shortText = (max) => z.string().trim().min(1).max(max);

const pagination = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(config.limits.maxPageSize).default(config.limits.pageSize),
});

const VISIBILITY = z.enum(['PUBLIC', 'COMMUNITY', 'PRIVATE']);
const CASE_STATUS = z.enum(['DRAFT', 'OPEN', 'ON_HOLD', 'RESOLVED', 'CLOSED']);
const SUPPORT_NEEDED = z.enum(['LISTENING', 'MEDIATION', 'LEGAL', 'COUNSELLING', 'COMMUNITY', 'PRACTICAL', 'OTHER']);

// ── Profiles ─────────────────────────────────────────────────────────────────
const upsertProfile = z.object({
    handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,29}$/,
        'A handle is 3–30 characters: letters, numbers, hyphen or underscore').optional(),
    displayName: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(1000).optional(),
    avatarUrl: z.string().url().max(500).optional().nullable(),
    countryCode: countryCode.optional().nullable(),
    region: z.string().trim().max(120).optional().nullable(),
    languages: z.array(z.string().trim().min(2).max(20)).max(10).optional(),
    isDiscoverable: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    defaultCaseVisibility: VISIBILITY.optional(),
});

// ── Cases ────────────────────────────────────────────────────────────────────
const createCase = z.object({
    title: shortText(140),
    summary: shortText(600),
    situation: z.string().trim().max(8000).optional(),
    supportNeeded: z.array(SUPPORT_NEEDED).max(7).optional(),
    // The default is the closed one. A case is private unless its author says otherwise.
    visibility: VISIBILITY.default('PRIVATE'),
    communityId: uuid.optional(),
    status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
    countryCode: countryCode.optional(),
    region: z.string().trim().max(120).optional(),
    allowSupporterRequests: z.boolean().optional(),
});

const updateCase = z.object({
    title: shortText(140).optional(),
    summary: shortText(600).optional(),
    situation: z.string().trim().max(8000).optional(),
    supportNeeded: z.array(SUPPORT_NEEDED).max(7).optional(),
    visibility: VISIBILITY.optional(),
    communityId: uuid.optional(),
    status: CASE_STATUS.optional(),
    countryCode: countryCode.optional().nullable(),
    region: z.string().trim().max(120).optional().nullable(),
    allowSupporterRequests: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

const listCases = pagination.extend({
    status: CASE_STATUS.optional(),
    visibility: VISIBILITY.optional(),
    communityId: uuid.optional(),
    countryCode: countryCode.optional(),
    mine: z.coerce.boolean().optional(),
    supporting: z.coerce.boolean().optional(),
    // Bounded so a search term cannot itself become a denial-of-service against ILIKE.
    q: z.string().trim().min(2).max(120).optional(),
    sort: z.enum(['recent', 'oldest', 'supported', 'updated']).default('recent'),
    supportNeeded: SUPPORT_NEEDED.optional(),
});

// ── Consent ──────────────────────────────────────────────────────────────────
const inviteParticipant = z.object({
    // A platform account id. There is no name or email field: a participant is a person who
    // already has an account and can answer for themselves.
    userId: uuid,
    relation: z.enum(ALL_RELATIONS.filter((r) => r !== 'SELF')),
});

const respondToInvitation = z.object({
    decision: z.enum([CONSENT.GRANTED, CONSENT.DECLINED]),
});

// A shareable invitation names a RELATION, never a person — there is no field here for a
// name, an email or a phone number, and adding one would defeat the whole design.
const createInvitation = z.object({
    relation: z.enum(ALL_RELATIONS.filter((r) => r !== 'SELF')),
    expiresInDays: z.coerce.number().int().min(1).max(60).default(14),
});

// The shape of a minted code: 16 characters over the Crockford-style alphabet.
const invitationToken = z.object({
    token: z.string().trim().toUpperCase().regex(/^[0-9A-HJKMNP-TV-Z]{16}$/, 'That is not a valid invitation code'),
});

// ── Support ──────────────────────────────────────────────────────────────────
const offerSupport = z.object({
    message: z.string().trim().max(1000).optional(),
});

const decideSupport = z.object({
    decision: z.enum(['ACCEPTED', 'DECLINED']),
});

// ── Communities ──────────────────────────────────────────────────────────────
const createCommunity = z.object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,63}$/, 'Use lowercase letters, numbers and hyphens'),
    name: shortText(120),
    description: z.string().trim().max(2000).optional(),
    purpose: z.string().trim().max(2000).optional(),
    rules: z.string().trim().max(4000).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
    joinPolicy: z.enum(['OPEN', 'REQUEST', 'INVITE']).default('REQUEST'),
    countryCode: countryCode.optional(),
    region: z.string().trim().max(120).optional(),
});

// Name, description, purpose and rules only. Visibility and join policy are deliberately
// absent: turning a private community public would expose everybody who joined on the
// understanding that it was not, which is a disclosure rather than an edit.
const updateCommunity = z.object({
    name: shortText(120).optional(),
    description: z.string().trim().max(2000).optional(),
    purpose: z.string().trim().max(2000).optional(),
    rules: z.string().trim().max(4000).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

// PENDING is moderator-only; the service enforces that, this only bounds the input.
const listMembers = pagination.extend({ status: z.enum(['ACTIVE', 'PENDING']).optional() });

const listCommunities = pagination.extend({
    countryCode: countryCode.optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    // Bounded like the case search, so a term cannot itself become a denial of service.
    q: z.string().trim().min(2).max(120).optional(),
    sort: z.enum(['name', 'newest', 'active']).default('name'),
});

// ── Discussion ───────────────────────────────────────────────────────────────
const createPost = z.object({
    communityId: uuid,
    title: shortText(160),
    body: shortText(20000),
});

const updatePost = z.object({
    title: shortText(160).optional(),
    body: shortText(20000).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

const listPosts = pagination.extend({ communityId: uuid });

const createComment = z.object({
    targetType: z.enum(['POST', 'CASE']),
    targetId: uuid,
    parentId: uuid.optional(),
    body: shortText(5000),
});

const updateComment = z.object({ body: shortText(5000) });

const listComments = pagination.extend({
    targetType: z.enum(['POST', 'CASE']),
    targetId: uuid,
});

const setReaction = z.object({
    targetType: z.enum(['CASE', 'POST', 'COMMENT']),
    targetId: uuid,
    kind: z.enum(['SUPPORT', 'THANKS', 'HELPFUL']),
});

// ── Notifications ────────────────────────────────────────────────────────────
const listNotifications = pagination.extend({ unreadOnly: z.coerce.boolean().optional() });

// ── Standing ─────────────────────────────────────────────────────────────────
// Only the two roles a moderator may confer. MODERATOR and ADMIN are absent by design: this
// endpoint must not be a way to nominate yourself for authority over other people.
const createRoleRequest = z.object({
    role: z.enum(['SUPPORTER', 'VOLUNTEER']),
    // The floor is not arbitrary — a one-word answer gives a moderator nothing to decide on,
    // and the whole point of the queue is that somebody read it.
    reason: z.string().trim().min(40).max(2000),
});

const listRoleRequests = pagination.extend({
    status: z.enum(['PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN', 'ALL']).optional(),
});

const decideRoleRequest = z.object({
    approve: z.boolean(),
    note: z.string().trim().max(2000).optional(),
});

// ── Safety ───────────────────────────────────────────────────────────────────
const createReport = z.object({
    targetType: z.enum(['CASE', 'POST', 'COMMENT', 'PROFILE', 'COMMUNITY']),
    targetId: uuid,
    reason: z.enum(['HARASSMENT', 'THREAT_OR_VIOLENCE', 'PRIVACY_VIOLATION', 'IMPERSONATION',
        'SPAM', 'HATE_SPEECH', 'SELF_HARM_RISK', 'COERCION', 'OFF_TOPIC', 'OTHER']),
    details: z.string().trim().max(2000).optional(),
});

const REPORT_REASON = z.enum(['HARASSMENT', 'THREAT_OR_VIOLENCE', 'PRIVACY_VIOLATION', 'IMPERSONATION',
    'SPAM', 'HATE_SPEECH', 'SELF_HARM_RISK', 'COERCION', 'OFF_TOPIC', 'OTHER']);

// Every filter here maps to a column that already exists. Severity is a real stored value —
// URGENT_REASONS become CRITICAL when the report is created — not a UI invention.
const listReports = pagination.extend({
    status: z.enum(['OPEN', 'TRIAGED', 'ACTIONED', 'DISMISSED']).optional(),
    severity: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
    reason: REPORT_REASON.optional(),
    targetType: z.enum(['CASE', 'POST', 'COMMENT', 'PROFILE', 'COMMUNITY']).optional(),
    unresolved: z.coerce.boolean().optional(),
    sort: z.enum(['triage', 'oldest', 'newest', 'updated']).default('triage'),
});

// Analytics and operations read the whole authorized dataset; the only input is the window.
const analyticsQuery = z.object({
    window: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
});

const reviewReport = z.object({
    status: z.enum(['OPEN', 'TRIAGED', 'ACTIONED', 'DISMISSED']),
    severity: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
    resolutionNote: z.string().trim().max(2000).optional(),
});

const moderationAction = z.object({
    targetType: z.enum(['CASE', 'POST', 'COMMENT', 'PROFILE', 'COMMUNITY', 'USER']),
    targetId: uuid,
    action: z.enum(['HIDE', 'UNHIDE', 'LOCK', 'UNLOCK', 'WARN', 'SUSPEND', 'UNSUSPEND', 'REMOVE', 'RESTORE', 'DISMISS_REPORT']),
    // Required, and long enough to be a sentence: a moderation record whose reason is "spam"
    // is not a reviewable decision.
    reason: z.string().trim().min(10).max(1000),
    expiresAt: z.coerce.date().optional(),
});

const listModeration = pagination.extend({
    targetType: z.string().trim().max(20).optional(),
    targetId: uuid.optional(),
    actorId: uuid.optional(),
});

// ── Resources ────────────────────────────────────────────────────────────────
const RESOURCE_CATEGORY = z.enum(['LEGAL', 'MEDIATION', 'COUNSELLING', 'SAFETY', 'RIGHTS', 'FINANCIAL', 'OTHER']);

const createResource = z.object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,79}$/, 'Use lowercase letters, numbers and hyphens'),
    title: shortText(160),
    summary: shortText(500),
    body: z.string().trim().max(20000).optional(),
    category: RESOURCE_CATEGORY,
    countryCode: countryCode.optional(),
    region: z.string().trim().max(120).optional(),
    url: z.string().url().max(500).optional(),
    providerName: z.string().trim().max(160).optional(),
    isPublished: z.boolean().default(false),
});

const updateResource = createResource.partial().omit({ slug: true })
    .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

const listResources = pagination.extend({
    category: RESOURCE_CATEGORY.optional(),
    countryCode: countryCode.optional(),
});

// ── Administration ───────────────────────────────────────────────────────────
const listUsers = pagination.extend({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
});

const roleChange = z.object({ role: z.enum(ALL_ROLES) });

const listAudit = pagination.extend({
    actorId: uuid.optional(),
    entityType: z.string().trim().max(40).optional(),
    action: z.string().trim().max(60).optional(),
});

const createCaseUpdate = z.object({ body: shortText(4000) });

const idParam = z.object({ id: uuid });

module.exports = {
    pagination, idParam,
    upsertProfile,
    createCase, updateCase, listCases,
    inviteParticipant, respondToInvitation,
    offerSupport, decideSupport, createCaseUpdate,
    createInvitation, invitationToken,
    createCommunity, updateCommunity, listMembers, analyticsQuery, listCommunities,
    createPost, updatePost, listPosts,
    createComment, updateComment, listComments, setReaction,
    listNotifications,
    createRoleRequest, listRoleRequests, decideRoleRequest,
    createReport, listReports, reviewReport,
    moderationAction, listModeration,
    createResource, updateResource, listResources,
    listUsers, roleChange, listAudit,
};
