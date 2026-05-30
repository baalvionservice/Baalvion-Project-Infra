'use strict';
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/documentController');

// In-memory upload (streamed to MinIO); 25 MB cap.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get('/',              authMiddleware, ctrl.listDocuments);
router.post('/upload',       authMiddleware, upload.single('file'), ctrl.uploadFile);
router.post('/',             authMiddleware, ctrl.uploadDocument); // metadata-only (back-compat)
router.get('/:id/download',  authMiddleware, ctrl.downloadDocument);
router.get('/:id',           authMiddleware, ctrl.getDocument);
router.delete('/:id',        authMiddleware, ctrl.deleteDocument);

module.exports = router;
