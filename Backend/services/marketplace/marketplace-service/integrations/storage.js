'use strict';
/**
 * Data-room object storage.
 *
 * The data room previously held no files. `file_url` was a client-supplied string, so a party
 * could register any URL as a "document" and nothing was ever actually stored, scanned or
 * access-checked on the way out. For a confidential room that is the whole product missing.
 *
 * WHY UPLOADS ARE BROKERED, NOT PRESIGNED
 * A presigned PUT hands the browser a URL that writes straight to the bucket, so the service
 * never sees the bytes and cannot magic-byte-validate or malware-scan them. A presigned GET is
 * worse here: it is a bearer URL that outlives the permission check, so revoking an NDA grant
 * would not revoke access to a link already issued. Everything goes through the service, which
 * means every read is permission-checked and audited at the moment it happens.
 *
 * DRIVERS
 *   local  — files under DATA_ROOM_PATH. The default, so the room works in development.
 *   s3     — any S3-compatible bucket, via DATA_ROOM_BUCKET + the standard AWS env.
 * The driver is chosen by DATA_ROOM_DRIVER. An unknown value fails loudly at first use rather
 * than silently falling back to local, which would put confidential documents on a pod disk.
 */
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

const DRIVER = (process.env.DATA_ROOM_DRIVER || 'local').toLowerCase();
const LOCAL_ROOT = process.env.DATA_ROOM_PATH || path.join(process.cwd(), '.data-room');
const BUCKET = process.env.DATA_ROOM_BUCKET || '';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Storage key for a document. Scoped by deal so one room's objects can never collide with
 * another's, and randomised so a key cannot be guessed from the deal id alone.
 *
 * BOTH components are constrained here rather than trusting the caller. The filename is attacker-
 * supplied by definition. The deal id reaches this from a route param — an unreadable one is
 * refused upstream by assertDealAccess long before an upload runs, and the local driver's
 * containment check would catch an escape on the way to disk, but neither belongs in this
 * function's contract: a key is built from a deal id and a filename, so it validates both.
 */
function buildKey({ dealId, filename }) {
    if (!UUID.test(String(dealId || ''))) {
        throw Object.assign(new Error('Invalid deal id'), { statusCode: 400, code: 'INVALID_KEY' });
    }
    const safe = String(filename || 'document')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.\-_]/g, '')
        .replace(/\.{2,}/g, '.')
        .slice(0, 120) || 'document';
    return `deals/${dealId}/${crypto.randomUUID()}-${safe}`;
}

// ── local driver ──────────────────────────────────────────────────────────────
const localPath = (key) => {
    const full = path.resolve(LOCAL_ROOT, key);
    // Refuse anything that escapes the root — the key is derived from a filename.
    if (!full.startsWith(path.resolve(LOCAL_ROOT) + path.sep)) {
        throw Object.assign(new Error('Invalid storage key'), { statusCode: 400, code: 'INVALID_KEY' });
    }
    return full;
};

const local = {
    async put(key, buffer) {
        const full = localPath(key);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, buffer, { mode: 0o600 });
        return { key, size: buffer.length };
    },
    async get(key) {
        try {
            return await fs.readFile(localPath(key));
        } catch {
            throw Object.assign(new Error('Stored object not found'), { statusCode: 404, code: 'OBJECT_NOT_FOUND' });
        }
    },
    async remove(key) {
        await fs.unlink(localPath(key)).catch(() => {});
    },
};

// ── s3 driver ─────────────────────────────────────────────────────────────────
let s3Client = null;
function getS3() {
    if (s3Client) return s3Client;
    if (!BUCKET) {
        throw Object.assign(
            new Error('Data-room storage is not configured (DATA_ROOM_BUCKET unset)'),
            { statusCode: 503, code: 'STORAGE_UNCONFIGURED' },
        );
    }
    // Required lazily so the service boots without the AWS SDK when the local driver is in use.
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
    return s3Client;
}

const s3 = {
    async put(key, buffer, contentType) {
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        await getS3().send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType,
            ServerSideEncryption: 'AES256',
        }));
        return { key, size: buffer.length };
    },
    async get(key) {
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const res = await getS3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const chunks = [];
        for await (const c of res.Body) chunks.push(c);
        return Buffer.concat(chunks);
    },
    async remove(key) {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    },
};

function driver() {
    if (DRIVER === 'local') {
        fsSync.mkdirSync(LOCAL_ROOT, { recursive: true });
        return local;
    }
    if (DRIVER === 's3') return s3;
    throw Object.assign(
        new Error(`Unknown DATA_ROOM_DRIVER "${DRIVER}" — expected "local" or "s3"`),
        { statusCode: 500, code: 'STORAGE_MISCONFIGURED' },
    );
}

module.exports = {
    buildKey,
    put: (key, buffer, contentType) => driver().put(key, buffer, contentType),
    get: (key) => driver().get(key),
    remove: (key) => driver().remove(key),
    DRIVER,
};
