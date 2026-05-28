'use strict';
// Local-disk file storage replacing the Supabase Storage `elite-proofs` bucket.
// Files are written under <UPLOAD_DIR>/<bucket>/<path> and served statically at
// /storage/<bucket>/<path> (see index.js).
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const config = require('../config/appConfig');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const ALLOWED_BUCKETS = new Set(['elite-proofs', 'avatars', 'founder-media']);
const ROOT = path.resolve(config.uploads.dir);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (founder pitch videos)
}).single('file');

function uploadHandler(req, res, next) {
    upload(req, res, (err) => {
        if (err) return next(new AppError('BAD_REQUEST', err.message, 400));
        try {
            const bucket = req.params.bucket;
            if (!ALLOWED_BUCKETS.has(bucket)) throw new AppError('BAD_REQUEST', 'Unknown bucket', 400);
            if (!req.file) throw new AppError('BAD_REQUEST', 'No file provided', 400);
            // Caller-provided object path; force it under the caller's own folder.
            const rawPath = String(req.body.path || req.file.originalname).replace(/\\/g, '/');
            const safe = rawPath.split('/').filter((p) => p && p !== '..').join('/');
            const objectPath = `${req.auth.userId}/${path.basename(safe)}`;
            const abs = path.join(ROOT, bucket, objectPath);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, req.file.buffer);
            const publicUrl = `${config.uploads.publicBaseUrl}/storage/${bucket}/${objectPath}`;
            return sendSuccess(req, res, { path: objectPath, fullPath: `${bucket}/${objectPath}`, publicUrl }, 201);
        } catch (e) { return next(e); }
    });
}

module.exports = { uploadHandler };
