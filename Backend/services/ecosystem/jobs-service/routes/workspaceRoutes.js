'use strict';
const { Router } = require('express');
const ctrl = require('../controller/workspaceController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();
router.use(authMiddleware); // every workspace route requires a valid session

// ─── Offers ───────────────────────────────────────────────────────────────────
router.get('/offers', ctrl.listOffers);
router.post('/offers', ctrl.createOffer);
router.get('/offers/:id', ctrl.getOffer);
router.patch('/offers/:id', ctrl.updateOfferStatus);
router.patch('/offers/:id/response', ctrl.respondToOffer);
router.delete('/offers/:id', ctrl.deleteOffer);
router.get('/applications/:id/offer', ctrl.getOfferForApplication);
router.post('/applications/:id/offer', ctrl.sendOfferForApplication);

// ─── Users (ATS team) ─────────────────────────────────────────────────────────
router.get('/users', ctrl.listUsers);
router.post('/users', ctrl.createUser);
router.get('/users/:id', ctrl.getUser);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

// ─── Organizations ─────────────────────────────────────────────────────────────
router.get('/organizations', ctrl.listOrganizations);

// ─── Payments ─────────────────────────────────────────────────────────────────
router.get('/payments', ctrl.listPayments);
router.patch('/payments/:id', ctrl.updatePaymentStatus);

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', ctrl.listNotifications);
router.post('/notifications', ctrl.createNotification);
router.post('/notifications/email', ctrl.sendEmail);
router.patch('/notifications/read-all', ctrl.markAllNotificationsRead);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);

// ─── Documents ────────────────────────────────────────────────────────────────
router.get('/documents', ctrl.listDocuments);
router.post('/documents', ctrl.createDocument);
router.patch('/documents/:id', ctrl.updateDocument);
router.delete('/documents/:id', ctrl.deleteDocument);
router.get('/candidates/:id/documents', ctrl.listCandidateDocuments);

// ─── Notes ────────────────────────────────────────────────────────────────────
router.get('/notes', ctrl.listNotes);
router.post('/notes', ctrl.createNote);
router.get('/candidates/:id/notes', ctrl.listNotes);

// ─── Audit ────────────────────────────────────────────────────────────────────
router.post('/audit/events', ctrl.logEvent);
router.get('/audit/logs', ctrl.getAuditLogs);

// ─── Projects + milestones ────────────────────────────────────────────────────
router.get('/projects', ctrl.listProjects);
router.post('/projects', ctrl.createProject);
router.get('/projects/:id', ctrl.getProject);
router.patch('/projects/:id', ctrl.updateProjectStatus);
router.get('/projects/:id/milestones', ctrl.listMilestones);
router.post('/projects/:id/milestones', ctrl.createMilestone);
router.patch('/milestones/:id', ctrl.updateMilestone);

module.exports = router;
