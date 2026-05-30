'use strict';
const router = require('express').Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/documentController');

// In-memory upload (streamed to MinIO); 25 MB cap; document/image types only
// (blocks executables/scripts). A rejected type leaves req.file unset -> 400 in the controller.
const ALLOWED_TYPES = /^(application\/pdf|image\/(png|jpe?g|gif|webp|tiff)|text\/(plain|csv)|application\/(msword|rtf|vnd\.openxmlformats-officedocument\.|vnd\.ms-excel|vnd\.ms-powerpoint))/i;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, ALLOWED_TYPES.test(file.mimetype || '')),
});

router.get('/',              authMiddleware, ctrl.listDocuments);
router.post('/upload',       authMiddleware, upload.single('file'), ctrl.uploadFile);
router.post('/',             authMiddleware, ctrl.uploadDocument); // metadata-only (back-compat)
router.get('/:id/download',  authMiddleware, ctrl.downloadDocument);
router.get('/:id',           authMiddleware, ctrl.getDocument);
router.delete('/:id',        authMiddleware, ctrl.deleteDocument);

module.exports = router;
