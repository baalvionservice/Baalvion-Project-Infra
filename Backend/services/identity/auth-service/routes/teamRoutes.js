const express = require('express');
const ctrl = require('../controller/teamController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All team routes require auth
router.use(authMiddleware);

router.get('/orgs', ctrl.listOrgs);
router.post('/orgs', ctrl.createOrg);
router.get('/orgs/:orgId/members', ctrl.getMembers);
router.post('/orgs/:orgId/invite', ctrl.inviteMember);
router.delete('/orgs/:orgId/members/:userId', ctrl.removeMember);
router.patch('/orgs/:orgId/members/:userId', ctrl.updateMemberRole);
router.get('/audit-logs', ctrl.getAuditLogs);

// Accept invitation (token from URL, user must be logged in)
router.post('/invitations/:token/accept', ctrl.acceptInvitation);

module.exports = router;
