'use strict';
// CMS media library routes. Mounted under /api/v1/cms/media (auth applied at the
// mount). Reads need any authenticated user; mutations require an elevated
// platform role (super_admin satisfies any check via hierarchical RBAC).
const router = require('express').Router();
const ctrl = require('../controller/mediaController');
const { requireRole } = require('../middleware/authMiddleware');

const canWrite = requireRole('admin'); // super_admin/owner also satisfy this

// Files
router.get('/files',                     ctrl.listFiles);
router.get('/files/:id',                 ctrl.getFile);
router.get('/files/:id/signed-url',      ctrl.signedUrl);
router.post('/upload',                   canWrite, ctrl.upload);
router.patch('/files/:id',               canWrite, ctrl.updateFile);
router.delete('/files/:id',              canWrite, ctrl.deleteFile);
router.post('/files/bulk-delete',        canWrite, ctrl.bulkDelete);

// Folders
router.get('/folders',                   ctrl.listFolders);
router.post('/folders',                  canWrite, ctrl.createFolder);
router.delete('/folders/:id',            canWrite, ctrl.deleteFolder);

module.exports = router;
