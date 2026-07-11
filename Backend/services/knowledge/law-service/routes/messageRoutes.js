'use strict';
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/messageController');

// Same guarded in-memory upload convention as documentRoutes.js/verificationRoutes.js:
// 25 MB cap, document/image types only, streamed to MinIO (never local disk).
const ALLOWED_TYPES = /^(application\/pdf|image\/(png|jpe?g|gif|webp|tiff)|text\/(plain|csv)|application\/(msword|vnd\.openxmlformats-officedocument\.|vnd\.ms-excel|vnd\.ms-powerpoint))/i;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.test(file.mimetype || '')),
});

router.get('/',              authMiddleware, ctrl.listMessages);
router.get('/unread-count',  authMiddleware, ctrl.unreadCount);
router.post('/',             authMiddleware, ctrl.sendMessage);
router.post('/upload',       authMiddleware, upload.single('file'), ctrl.uploadFile);
router.post('/call',         authMiddleware, ctrl.startCall);
router.get('/:id/file',      authMiddleware, ctrl.downloadFile);
router.patch('/:id/read',    authMiddleware, ctrl.markRead);

module.exports = router;
