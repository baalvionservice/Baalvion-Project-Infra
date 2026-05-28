const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendError } = require('../utils/response');

// ─── S3 Client ────────────────────────────────────────────────────────────────

const s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
});

const BUCKET = process.env.S3_BUCKET || 'baalvion-assets';
const PRESIGN_EXPIRY = 900; // 15 minutes

// ─── Allowed File Types ───────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml',
];

const ALLOWED_DOC_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_VIDEO_TYPES];

// Default max sizes per content-type category (MB)
const MAX_IMAGE_MB = 20;
const MAX_DOC_MB = 50;
const MAX_VIDEO_MB = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(orgId, userId, module, filename) {
    const sanitized = filename
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.\-_]/g, '')
        .slice(0, 128);
    return `tenants/${orgId}/${module}/${userId}/${uuidv4()}-${sanitized}`;
}

function getMaxMb(contentType) {
    if (ALLOWED_IMAGE_TYPES.includes(contentType)) return MAX_IMAGE_MB;
    if (ALLOWED_VIDEO_TYPES.includes(contentType)) return MAX_VIDEO_MB;
    return MAX_DOC_MB;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/upload/presign
 * Body: { filename, contentType, module?, fileSizeBytes? }
 * Returns: { uploadUrl, key, expiresAt }
 */
async function presignUpload(req, res) {
    try {
        const { filename, contentType, module: uploadModule = 'general', fileSizeBytes } = req.body;

        if (!filename || typeof filename !== 'string' || filename.trim() === '') {
            return sendError(req, res, new AppError('VALIDATION_ERROR', 'filename is required', 400));
        }
        if (!contentType || typeof contentType !== 'string') {
            return sendError(req, res, new AppError('VALIDATION_ERROR', 'contentType is required', 400));
        }
        if (!ALL_ALLOWED_TYPES.includes(contentType)) {
            return sendError(req, res, new AppError('INVALID_FILE_TYPE', `Content type "${contentType}" is not allowed`, 415));
        }

        // Optional size pre-check when client sends the file size
        if (fileSizeBytes != null) {
            const maxMb = getMaxMb(contentType);
            const maxBytes = maxMb * 1024 * 1024;
            if (Number(fileSizeBytes) > maxBytes) {
                return sendError(req, res, new AppError('FILE_TOO_LARGE', `File exceeds the ${maxMb} MB limit for this type`, 413));
            }
        }

        const { userId, orgId } = req.auth;
        const key = buildKey(orgId, userId, uploadModule, filename);

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY });

        return sendSuccess(req, res, {
            uploadUrl,
            key,
            expiresAt: new Date(Date.now() + PRESIGN_EXPIRY * 1000).toISOString(),
            bucket: BUCKET,
        }, 200);
    } catch (err) {
        console.error('[uploadController] presignUpload error:', err);
        return sendError(req, res, new AppError('INTERNAL_ERROR', 'Failed to generate upload URL', 500));
    }
}

/**
 * GET /api/upload/signed/:key
 * Returns: { downloadUrl, expiresAt }
 * Note: :key may contain slashes — handled via wildcard route.
 */
async function presignDownload(req, res) {
    try {
        const key = Array.isArray(req.params.splat) ? req.params.splat.join('/') : (req.params.splat || ''); // captured by wildcard

        if (!key) {
            return sendError(req, res, new AppError('VALIDATION_ERROR', 'Object key is required', 400));
        }

        // Ensure the requester's org owns this key
        const { orgId } = req.auth;
        if (!key.startsWith(`tenants/${orgId}/`)) {
            return sendError(req, res, new AppError('FORBIDDEN', 'Access denied to this object', 403));
        }

        const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
        const downloadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY });

        return sendSuccess(req, res, {
            downloadUrl,
            key,
            expiresAt: new Date(Date.now() + PRESIGN_EXPIRY * 1000).toISOString(),
        }, 200);
    } catch (err) {
        console.error('[uploadController] presignDownload error:', err);
        return sendError(req, res, new AppError('INTERNAL_ERROR', 'Failed to generate download URL', 500));
    }
}

/**
 * DELETE /api/upload/*
 * Deletes an object from S3. Requires auth.
 */
async function deleteFile(req, res) {
    try {
        const key = Array.isArray(req.params.splat) ? req.params.splat.join('/') : (req.params.splat || '');

        if (!key) {
            return sendError(req, res, new AppError('VALIDATION_ERROR', 'Object key is required', 400));
        }

        // Ownership check — only delete objects belonging to this org
        const { orgId } = req.auth;
        if (!key.startsWith(`tenants/${orgId}/`)) {
            return sendError(req, res, new AppError('FORBIDDEN', 'Access denied to this object', 403));
        }

        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));

        return sendSuccess(req, res, { deleted: true, key }, 200);
    } catch (err) {
        console.error('[uploadController] deleteFile error:', err);
        return sendError(req, res, new AppError('INTERNAL_ERROR', 'Failed to delete object', 500));
    }
}

module.exports = { presignUpload, presignDownload, deleteFile };
