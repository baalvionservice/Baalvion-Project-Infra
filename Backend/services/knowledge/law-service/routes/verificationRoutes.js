'use strict';
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const ctrl = require('../controller/verificationController');

// Same guarded in-memory upload convention as documentRoutes.js: 25 MB cap,
// document/image types only, streamed to MinIO (never written to local disk).
const ALLOWED_TYPES = /^(application\/pdf|image\/(png|jpe?g|gif|webp|tiff))/i;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.test(file.mimetype || '')),
});

router.post('/me',        authMiddleware, upload.single('file'), ctrl.uploadMyVerificationDocument);
router.get('/me',         authMiddleware, ctrl.listMyVerificationDocuments);

router.get('/queue',            authMiddleware, adminOnly, ctrl.listVerificationQueue);
router.get('/:id/download',     authMiddleware, adminOnly, ctrl.getVerificationDocumentDownload);
router.post('/:id/review',      authMiddleware, adminOnly, ctrl.reviewVerificationDocument);

module.exports = router;
