const { Router } = require('express');
const ctrl = require('../controller/jobsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

// ─── Skills (public) ─────────────────────────────────────────────────────────
router.get('/skills', ctrl.listSkills);

// ─── Search (public, Elasticsearch-backed with DB fallback) ──────────────────
router.get('/jobs/search', ctrl.searchJobs);

// ─── Jobs ────────────────────────────────────────────────────────────────────
router.get('/jobs', ctrl.listJobs);
router.post('/jobs', authMiddleware, ctrl.createJob);
router.get('/jobs/:id', ctrl.getJob);
router.patch('/jobs/:id', authMiddleware, ctrl.updateJob);
router.delete('/jobs/:id', authMiddleware, ctrl.deleteJob);
router.post('/jobs/:id/publish', authMiddleware, ctrl.publishJob);
router.post('/jobs/:id/close', authMiddleware, ctrl.closeJob);
router.get('/jobs/:id/applications', authMiddleware, ctrl.listJobApplications);

// ─── Applications ────────────────────────────────────────────────────────────
router.get('/applications', authMiddleware, ctrl.listApplications);
router.post('/applications', ctrl.createApplication);
router.get('/applications/:id', authMiddleware, ctrl.getApplication);
router.patch('/applications/:id', authMiddleware, ctrl.updateApplication);
router.post('/applications/:id/move-stage', authMiddleware, ctrl.moveApplicationStage);

// ─── Candidates ───────────────────────────────────────────────────────────────
router.get('/candidates', authMiddleware, ctrl.listCandidates);
router.post('/candidates', authMiddleware, ctrl.createCandidate);
router.get('/candidates/:id', authMiddleware, ctrl.getCandidate);
router.patch('/candidates/:id', authMiddleware, ctrl.updateCandidate);

// ─── Interviews ───────────────────────────────────────────────────────────────
router.post('/interviews', authMiddleware, ctrl.scheduleInterview);
router.get('/interviews', authMiddleware, ctrl.listInterviews);
router.get('/interviews/:id', authMiddleware, ctrl.getInterview);
router.patch('/interviews/:id', authMiddleware, ctrl.updateInterview);
router.delete('/interviews/:id', authMiddleware, ctrl.cancelInterview);
router.post('/interviews/:id/feedback', authMiddleware, ctrl.submitFeedback);

// ─── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/hiring', authMiddleware, ctrl.getHiringAnalytics);

// ─── Campus: AI talent matching ───────────────────────────────────────────────
const campusCtrl = require('../controller/campusController');
router.get('/talent/matches', authMiddleware, campusCtrl.getAIMatches);

// ─── Admin: Search reindex ────────────────────────────────────────────────────
router.post('/admin/reindex', authMiddleware, ctrl.reindexJobs);

// ─── Uploads ─────────────────────────────────────────────────────────────────
// Returns a presigned URL so the client uploads directly to S3
router.post('/uploads/presign', authMiddleware, ctrl.presignUpload);
// Authenticated direct upload (multipart) → S3/MinIO (documents, avatars, etc.)
router.post('/uploads/resume', authMiddleware, ctrl.uploadFile);
router.post('/uploads/file', authMiddleware, ctrl.uploadFile);
// PUBLIC direct upload — the careers apply flow (anonymous candidates) needs to attach a
// resume/certificate. Same mime/size guards apply in the upload service.
router.post('/uploads/public', ctrl.uploadFile);

module.exports = router;
