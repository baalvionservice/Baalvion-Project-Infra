'use strict';
// Object storage for documents — MinIO (S3-compatible) via the AWS SDK.
// The service uploads via the INTERNAL endpoint (e.g. http://minio:9000 on the docker net),
// but browser download URLs are presigned against the PUBLIC endpoint (http://localhost:9000)
// because SigV4 signs the host — a URL signed for minio:9000 isn't reachable from a browser.
const {
    S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
    HeadBucketCommand, CreateBucketCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'baalvion';
const SECRET_KEY = process.env.MINIO_SECRET_KEY || 'baalvion_dev_pass';
const BUCKET = process.env.MINIO_BUCKET || 'law-documents';

const baseCfg = {
    region: process.env.MINIO_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
};
const s3 = new S3Client({ ...baseCfg, endpoint: ENDPOINT });
const s3Public = new S3Client({ ...baseCfg, endpoint: PUBLIC_ENDPOINT });

let _bucketReady = false;
async function ensureBucket() {
    if (_bucketReady) return;
    try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
        _bucketReady = true;
    } catch {
        try {
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
            _bucketReady = true;
            console.log(`[storage] created bucket ${BUCKET}`);
        } catch (e) {
            console.error('[storage] ensureBucket failed:', e.message);
            throw e;
        }
    }
}

async function putObject(key, body, contentType) {
    await ensureBucket();
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType || 'application/octet-stream' }));
    return key;
}

async function presignedGetUrl(key, expiresIn = 3600) {
    return getSignedUrl(s3Public, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

async function deleteObject(key) {
    try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })); } catch (_) { /* best effort */ }
}

const isStorageKey = (url) => !!url && !/^[a-z]+:\/\//i.test(url); // real keys have no scheme (placeholders use pending://)

module.exports = { putObject, presignedGetUrl, deleteObject, ensureBucket, isStorageKey, BUCKET, ENDPOINT };
