const express = require('express');
const ctrl = require('../controller/teamController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All team routes require auth. Fine-grained capability checks (manage-users / manage-org)
// are enforced in teamService against the caller's membership role.
router.use(authMiddleware);

// ── Organizations the caller belongs to ──────────────────────────────────────
router.get('/orgs', ctrl.listOrgs);
router.post('/orgs', ctrl.createOrg);
router.get('/orgs/:orgId', ctrl.getOrg);
router.patch('/orgs/:orgId', ctrl.updateOrg);
router.post('/orgs/:orgId/transfer-ownership', ctrl.transferOwnership);

// ── Members ───────────────────────────────────────────────────────────────────
router.get('/orgs/:orgId/members', ctrl.getMembers);
router.delete('/orgs/:orgId/members/:userId', ctrl.removeMember);
router.patch('/orgs/:orgId/members/:userId', ctrl.updateMemberRole);
router.post('/orgs/:orgId/members/:userId/suspend', ctrl.suspendMember);
router.post('/orgs/:orgId/members/:userId/reactivate', ctrl.reactivateMember);
router.post('/orgs/:orgId/members/:userId/force-password-reset', ctrl.forcePasswordReset);
router.post('/orgs/:orgId/members/:userId/force-mfa', ctrl.forceMfa);

// ── Invitations ─────────────────────────────────────────────────────────────
router.post('/orgs/:orgId/invite', ctrl.inviteMember);
router.post('/orgs/:orgId/invite/bulk', ctrl.bulkInvite);
router.get('/orgs/:orgId/invitations', ctrl.listInvitations);
router.post('/orgs/:orgId/invitations/:invitationId/resend', ctrl.resendInvitation);
router.delete('/orgs/:orgId/invitations/:invitationId', ctrl.revokeInvitation);

// Accept invitation (token from URL, user must be logged in)
router.post('/invitations/:token/accept', ctrl.acceptInvitation);

// Org-scoped audit feed (caller's own org)
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
