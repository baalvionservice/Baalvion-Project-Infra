'use strict';
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const BUCKET  = process.env.S3_BUCKET  || 'baalvion-jobs';
const REGION  = process.env.S3_REGION  || 'ap-south-1';
const PREFIX  = process.env.S3_PREFIX  || '';
const TTL_SEC = parseInt(process.env.S3_PRESIGN_TTL_SECONDS || '900', 10); // 15 min

// Supports AWS S3, MinIO, and any S3-compatible endpoint
const s3 = new S3Client({
    region: REGION,
    ...(process.env.S3_ENDPOINT ? {
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
    } : {}),
    credentials: process.env.S3_ACCESS_KEY ? {
        accessKeyId:     process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY || '',
    } : undefined,
});

const ALLOWED_MIME = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
]);

const MAX_FILE_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES || String(10 * 1024 * 1024)); // 10 MB default

function buildKey(folder, originalName) {
    const ext  = path.extname(originalName).toLowerCase() || '';
    const base = `${PREFIX}${folder}/${uuidv4()}${ext}`;
    return base;
}

function buildPublicUrl(key) {
    if (process.env.S3_PUBLIC_URL) return `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    if (process.env.S3_ENDPOINT)   return `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`;
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// ── Presigned URL (client uploads directly to S3) ─────────────────────────────

async function getPresignedUploadUrl({ folder = 'misc', filename, contentType, fileSizeBytes }) {
    if (!ALLOWED_MIME.has(contentType)) {
        throw new Error(`File type not allowed: ${contentType}`);
    }
    if (fileSizeBytes && fileSizeBytes > MAX_FILE_BYTES) {
        throw new Error(`File exceeds max size of ${MAX_FILE_BYTES / 1024 / 1024} MB`);
    }

    const key = buildKey(folder, filename);
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
        ...(fileSizeBytes ? { ContentLength: fileSizeBytes } : {}),
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: TTL_SEC });
    const publicUrl = buildPublicUrl(key);

    return { uploadUrl, publicUrl, key, expiresIn: TTL_SEC };
}

// ── Direct upload (server receives file, then pushes to S3) ──────────────────

async function uploadBuffer({ folder = 'misc', filename, contentType, buffer }) {
    if (!ALLOWED_MIME.has(contentType)) throw new Error(`File type not allowed: ${contentType}`);
    if (buffer.length > MAX_FILE_BYTES) throw new Error('File too large');

    const key = buildKey(folder, filename);
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));

    return { key, publicUrl: buildPublicUrl(key) };
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function deleteFile(key) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return { deleted: true, key };
}

// ── Verify file exists ────────────────────────────────────────────────────────

async function fileExists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

module.exports = { getPresignedUploadUrl, uploadBuffer, deleteFile, fileExists, BUCKET, buildPublicUrl };
