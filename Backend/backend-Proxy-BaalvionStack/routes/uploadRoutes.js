const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const { presignUpload, presignDownload, deleteFile } = require('../controller/uploadController');

const router = express.Router();

/**
 * POST /api/upload/presign
 * Generate a presigned PUT URL so the client can upload directly to S3.
 * Body: { filename: string, contentType: string, module?: string, fileSizeBytes?: number }
 */
router.post('/presign', authMiddleware, presignUpload);

/**
 * GET /api/upload/signed/*
 * Generate a presigned GET URL for downloading an object.
 * The wildcard captures the full S3 key (which may contain slashes).
 */
router.get('/signed/*', authMiddleware, presignDownload);

/**
 * DELETE /api/upload/*
 * Permanently delete an object from S3.
 * The wildcard captures the full S3 key.
 */
router.delete('/*', authMiddleware, deleteFile);

module.exports = router;
