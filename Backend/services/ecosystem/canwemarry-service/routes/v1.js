'use strict';
/**
 * The v1 API surface.
 *
 * The file is laid out by trust boundary — PUBLIC, then AUTHENTICATED, then MODERATOR,
 * then ADMIN — so the security posture of a route is legible from where it sits rather
 * than from reading its handler. Every route names its own gate; nothing is protected
 * only by being mounted below something else.
 */
const express = require('express');

const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const { requirePermission, requireStaff, requireAdmin } = require('../middleware/authorize');
const { requireVerified } = require('../middleware/requireVerified');
const { validate } = require('../middleware/validate');
const { uuidParams } = require('../middleware/uuidParams');
const { writeLimiter, reportLimiter } = require('../middleware/rateLimit');
const { PERMISSIONS } = require('../domain/permissions');
const S = require('../validators/schemas');

const profiles = require('../controller/profileController');
const cases = require('../controller/caseController');
const communities = require('../controller/communityController');
const discussion = require('../controller/discussionController');
const notifications = require('../controller/notificationController');
const resources = require('../controller/resourceController');
const reports = require('../controller/reportController');
const roleRequests = require('../controller/roleRequestController');
const moderation = require('../controller/moderationController');
const admin = require('../controller/adminController');
const operations = require('../controller/operationsController');
const meController = require('../controller/meController');
const invitations = require('../controller/invitationController');

const router = express.Router();
const write = writeLimiter();

// Applied to every route: a path parameter that cannot be an identifier is answered 404 here
// rather than reaching Postgres, which refused it with a type error and produced a 500.
// Express only runs this for parameters a matched route actually declares.
router.param('id', (req, res, next) => uuidParams(req, res, next));
for (const name of ['updateId', 'participantId', 'supporterId', 'invitationId', 'userId', 'targetId']) {
    router.param(name, (req, res, next) => uuidParams(req, res, next));
}

// Actions gated on a confirmed email address carry requireVerified(action). The gate sits
// AFTER requireAuth (it reads the token's claim) and BEFORE the permission check, so an
// unverified caller is told to confirm their address rather than that they lack a right they
// actually hold. Publishing a case is gated in the service layer instead — create and update
// are two doors into the same act, and only the service sees both.

// ══ PUBLIC ═══════════════════════════════════════════════════════════════════
// Readable without an account. optionalAuth still resolves a session when one is
// present, so a signed-in visitor sees their own cases in the same list — but an
// anonymous caller gets the anonymous permission set, not a member's.

router.get('/cases', optionalAuth, validate(S.listCases, 'query'), cases.list);
router.get('/cases/reference/:reference', optionalAuth, cases.getByReference);
router.get('/cases/:id', optionalAuth, cases.get);
router.get('/cases/:id/related', optionalAuth, cases.related);

router.get('/communities', optionalAuth, validate(S.listCommunities, 'query'), communities.list);
router.get('/communities/slug/:slug', optionalAuth, communities.getBySlug);
router.get('/communities/:id', optionalAuth, communities.getById);

router.get('/posts', optionalAuth, validate(S.listPosts, 'query'), discussion.listPosts);
router.get('/posts/:id', optionalAuth, discussion.getPost);
router.get('/comments', optionalAuth, validate(S.listComments, 'query'), discussion.listComments);
router.get('/reactions/:targetType/:targetId', optionalAuth, discussion.reactionSummary);

router.get('/resources', optionalAuth, validate(S.listResources, 'query'), resources.list);
router.get('/resources/:slug', optionalAuth, resources.getBySlug);

router.get('/profiles/:handle', optionalAuth, profiles.getByHandle);

// — Invitation preview. Deliberately public: somebody holding a code has to be able to see
//   what they are being asked to join before signing in. It reveals no case content, and
//   carries the report limiter because it is the one surface worth brute-forcing.
router.get('/invitations/:token', reportLimiter(), invitations.preview);

// ══ AUTHENTICATED ════════════════════════════════════════════════════════════
// Everything below requires a verified identity. The permission gate names the
// capability; the service that runs afterwards re-checks the specific record.

// — Who am I. Answers for anonymous callers too (authenticated: false), because the app
//   asks on load precisely because it does not know yet. Drives which navigation renders;
//   every route below still enforces its own permission, so a client that ignores this
//   learns nothing it could act on.
router.get('/me', optionalAuth, meController.whoami);

// — Own profile and settings
router.get('/me/profile', requireAuth, profiles.getMine);
router.put('/me/profile', requireAuth, write, requirePermission(PERMISSIONS.PROFILE_UPDATE_SELF),
    validate(S.upsertProfile), profiles.upsertMine);

// — Notifications and the consent inbox
router.get('/me/notifications', requireAuth, requirePermission(PERMISSIONS.NOTIFICATION_READ_SELF),
    validate(S.listNotifications, 'query'), notifications.list);
router.get('/me/notifications/unread-count', requireAuth, notifications.unreadCount);
router.post('/me/notifications/:id/read', requireAuth, notifications.markRead);
router.post('/me/notifications/read-all', requireAuth, write, notifications.markAllRead);
router.get('/me/invitations', requireAuth, notifications.myInvitations);
router.get('/me/reports', requireAuth, validate(S.pagination, 'query'), reports.listMine);

// Asking for supporter or volunteer standing. Any signed-in member may ask; the answer is a
// moderator's. See service/roleRequestService.js for why the capability is not a default.
router.get('/me/role-requests', requireAuth, roleRequests.listMine);
router.post('/me/role-requests', requireAuth, write, validate(S.createRoleRequest), roleRequests.create);
router.post('/me/role-requests/:id/withdraw', requireAuth, write, roleRequests.withdraw);

// — Cases
router.post('/cases', requireAuth, write, requirePermission(PERMISSIONS.CASE_CREATE),
    validate(S.createCase), cases.create);
router.patch('/cases/:id', requireAuth, write, requirePermission(PERMISSIONS.CASE_UPDATE),
    validate(S.updateCase), cases.update);
router.delete('/cases/:id', requireAuth, write, requirePermission(PERMISSIONS.CASE_DELETE), cases.remove);

// — Consent. Inviting is the owner's act; answering is the invitee's alone, which is
//   why the response routes carry no permission gate beyond being signed in — the
//   identity check lives in domain/consent.canRespond and admits nobody else.
router.get('/cases/:id/participants', requireAuth, cases.listParticipants);
router.post('/cases/:id/participants', requireAuth, write, validate(S.inviteParticipant), cases.inviteParticipant);
router.post('/cases/:id/participants/:participantId/respond', requireAuth, write,
    validate(S.respondToInvitation), cases.respondToInvitation);
router.post('/cases/:id/participants/:participantId/withdraw', requireAuth, write, cases.withdrawConsent);

// — Shareable invitations. Creating and withdrawing are the owner's; answering is the
//   holder's, and requires a session because accepting IS the act of consenting.
router.get('/cases/:id/invitations', requireAuth, invitations.listForCase);
router.post('/cases/:id/invitations', requireAuth, write, validate(S.createInvitation), invitations.create);
router.delete('/cases/:id/invitations/:invitationId', requireAuth, write, invitations.revoke);
router.get('/me/invitations-sent', requireAuth, invitations.listMine);
router.post('/invitations/:token/accept', requireAuth, write, requireVerified('invitation:accept'), invitations.accept);
router.post('/invitations/:token/decline', requireAuth, write, invitations.decline);

// — Updates. Readable by anyone who can read the case; writable only by its owner.
router.get('/cases/:id/updates', optionalAuth, validate(S.pagination, 'query'), cases.listUpdates);
router.post('/cases/:id/updates', requireAuth, write, requirePermission(PERMISSIONS.CASE_UPDATE),
    validate(S.createCaseUpdate), cases.createUpdate);
router.delete('/cases/:id/updates/:updateId', requireAuth, write, cases.deleteUpdate);

// — Support. Offering requires the SUPPORTER capability; accepting is the owner's decision.
router.get('/cases/:id/supporters', requireAuth, cases.listSupporters);
router.post('/cases/:id/supporters', requireAuth, write, requireVerified('case:support'), requirePermission(PERMISSIONS.CASE_SUPPORT),
    validate(S.offerSupport), cases.offerSupport);
router.post('/cases/:id/supporters/:supporterId/decide', requireAuth, write,
    validate(S.decideSupport), cases.decideSupport);
router.post('/cases/:id/supporters/withdraw', requireAuth, write, cases.withdrawSupport);
router.delete('/cases/:id/supporters/:supporterId', requireAuth, write, cases.revokeSupporter);

// — Communities
router.post('/communities', requireAuth, write, requirePermission(PERMISSIONS.COMMUNITY_CREATE),
    validate(S.createCommunity), communities.create);
router.post('/communities/:id/join', requireAuth, write, requireVerified('community:join'), requirePermission(PERMISSIONS.COMMUNITY_JOIN),
    communities.join);
router.post('/communities/:id/leave', requireAuth, write, communities.leave);
router.get('/communities/:id/members', requireAuth, validate(S.listMembers, 'query'), communities.listMembers);
router.patch('/communities/:id', requireAuth, write, validate(S.updateCommunity), communities.update);
router.post('/communities/:id/members/:userId/approve', requireAuth, write, communities.approveMember);
router.post('/communities/:id/members/:userId/decline', requireAuth, write, communities.declineMember);
router.delete('/communities/:id/members/:userId', requireAuth, write, communities.removeMember);

// — Discussion
router.post('/posts', requireAuth, write, requireVerified('post:create'), requirePermission(PERMISSIONS.POST_CREATE),
    validate(S.createPost), discussion.createPost);
router.patch('/posts/:id', requireAuth, write, validate(S.updatePost), discussion.updatePost);
router.delete('/posts/:id', requireAuth, write, discussion.deletePost);

router.post('/comments', requireAuth, write, requireVerified('comment:create'), requirePermission(PERMISSIONS.COMMENT_CREATE),
    validate(S.createComment), discussion.createComment);
router.patch('/comments/:id', requireAuth, write, validate(S.updateComment), discussion.updateComment);
router.delete('/comments/:id', requireAuth, write, discussion.deleteComment);

router.put('/reactions', requireAuth, write, requirePermission(PERMISSIONS.REACTION_CREATE),
    validate(S.setReaction), discussion.setReaction);
router.delete('/reactions/:targetType/:targetId', requireAuth, write, discussion.clearReaction);

// — Reporting. Its own tighter limiter: a floodable report queue is a denial of service
//   against the moderators the safety model depends on.
router.post('/reports', requireAuth, reportLimiter(), requireVerified('report:create'), requirePermission(PERMISSIONS.REPORT_CREATE),
    validate(S.createReport), reports.create);

// ══ MODERATOR ════════════════════════════════════════════════════════════════
// requireStaff is a role gate AND each route names the permission it needs, so
// narrowing a role's permissions takes effect here without touching the routes.

// ── Operations ───────────────────────────────────────────────────────────────
// Aggregates only. None of these accepts an identifier, so none can be pointed at a person.
// The command centre is for anyone who works the queue; the platform-wide views are
// administrator-only, because they describe the deployment rather than the queue.
router.get('/moderation/summary', requireAuth, requireStaff, requirePermission(PERMISSIONS.REPORT_REVIEW),
    operations.summary);
router.get('/admin/analytics', requireAuth, requireAdmin, requirePermission(PERMISSIONS.ADMIN_AUDIT),
    validate(S.analyticsQuery, 'query'), operations.analytics);
router.get('/admin/health', requireAuth, requireAdmin, requirePermission(PERMISSIONS.ADMIN_AUDIT),
    operations.health);
router.get('/admin/configuration', requireAuth, requireAdmin, requirePermission(PERMISSIONS.ADMIN_AUDIT),
    operations.configuration);

router.get('/moderation/reports', requireAuth, requireStaff, requirePermission(PERMISSIONS.REPORT_REVIEW),
    validate(S.listReports, 'query'), reports.listQueue);
router.get('/moderation/reports/:id', requireAuth, requireStaff, requirePermission(PERMISSIONS.REPORT_REVIEW),
    reports.get);
router.post('/moderation/reports/:id/review', requireAuth, requireStaff, requirePermission(PERMISSIONS.REPORT_REVIEW),
    validate(S.reviewReport), reports.review);

router.get('/moderation/role-requests', requireAuth, requireStaff, requirePermission(PERMISSIONS.USER_ROLE_GRANT), validate(S.listRoleRequests, 'query'), roleRequests.queue);
router.get('/moderation/role-requests/:id', requireAuth, requireStaff, requirePermission(PERMISSIONS.USER_ROLE_GRANT), roleRequests.get);
router.post('/moderation/role-requests/:id/decide', requireAuth, requireStaff, write, requirePermission(PERMISSIONS.USER_ROLE_GRANT), validate(S.decideRoleRequest), roleRequests.decide);

router.post('/moderation/actions', requireAuth, requireStaff, requirePermission(PERMISSIONS.ADMIN_MODERATION),
    validate(S.moderationAction), moderation.act);
router.get('/moderation/actions', requireAuth, requireStaff, requirePermission(PERMISSIONS.ADMIN_MODERATION),
    validate(S.listModeration, 'query'), moderation.history);

// Resource curation — volunteers as well as staff, so requirePermission is the gate
// here rather than a role.
router.post('/resources', requireAuth, write, requirePermission(PERMISSIONS.RESOURCE_MANAGE),
    validate(S.createResource), resources.create);
router.patch('/resources/:id', requireAuth, write, requirePermission(PERMISSIONS.RESOURCE_MANAGE),
    validate(S.updateResource), resources.update);

// ══ ADMIN ════════════════════════════════════════════════════════════════════

router.get('/admin/users', requireAuth, requireAdmin, requirePermission(PERMISSIONS.ADMIN_USERS),
    validate(S.listUsers, 'query'), admin.listUsers);
// Role changes are open to moderators, but only for SUPPORTER and VOLUNTEER —
// userService.grantRole rejects anything higher from a non-admin.
router.post('/admin/users/:id/roles', requireAuth, requireStaff, requirePermission(PERMISSIONS.USER_ROLE_GRANT),
    validate(S.roleChange), admin.grantRole);
router.delete('/admin/users/:id/roles', requireAuth, requireStaff, requirePermission(PERMISSIONS.USER_ROLE_GRANT),
    validate(S.roleChange), admin.revokeRole);

router.get('/admin/cases', requireAuth, requireStaff, requirePermission(PERMISSIONS.CASE_MODERATE),
    validate(S.listCases, 'query'), admin.listCases);

router.get('/admin/audit', requireAuth, requireAdmin, requirePermission(PERMISSIONS.ADMIN_AUDIT),
    validate(S.listAudit, 'query'), admin.listAudit);

module.exports = router;
