'use strict';
/**
 * Minimal S3 (MinIO) client with AWS Signature V4 — dependency-free (Node http +
 * crypto only). The `minio`/`@aws-sdk` packages aren't dependencies of this
 * service, so we sign requests ourselves. Path-style addressing, region
 * us-east-1 (MinIO default). Covers what the product-media library needs:
 * ensureBucket, putObject, deleteObject, presigned GET URLs, public URLs.
 *
 * Identical signing implementation to cms-service/utils/s3Client.js so the two
 * media stores behave the same against the same MinIO/S3 backend.
 */
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const ENDPOINT   = (process.env.S3_ENDPOINT   || 'http://localhost:9000').replace(/\/$/, '');
const PUBLIC_URL = (process.env.S3_PUBLIC_URL || ENDPOINT).replace(/\/$/, '');
const REGION     = process.env.S3_REGION      || 'us-east-1';
const ACCESS     = process.env.S3_ACCESS_KEY  || 'baalvion';
const SECRET     = process.env.S3_SECRET_KEY  || 'baalvion_dev_pass';
const SERVICE    = 's3';

const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

// RFC3986 encoding (AWS-compatible). encodeSlash=false keeps '/' for object paths.
function uriEncode(str, encodeSlash = true) {
    return String(str).split('').map((ch) => {
        if (/[A-Za-z0-9\-_.~]/.test(ch)) return ch;
        if (ch === '/' && !encodeSlash) return ch;
        return '%' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
    }).join('');
}

function amzDates() {
    const d = new Date();
    const amzdate = d.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
    return { amzdate, datestamp: amzdate.slice(0, 8) };
}

function signingKey(datestamp) {
    const kDate = hmac('AWS4' + SECRET, datestamp);
    const kRegion = hmac(kDate, REGION);
    const kService = hmac(kRegion, SERVICE);
    return hmac(kService, 'aws4_request');
}

function request(method, bucket, key, { body = Buffer.alloc(0), contentType } = {}) {
    return new Promise((resolve, reject) => {
        const base = new URL(ENDPOINT);
        const host = base.host;
        const lib = base.protocol === 'https:' ? https : http;
        const canonicalUri = '/' + uriEncode(bucket) + (key ? '/' + uriEncode(key, false) : '/');
        const { amzdate, datestamp } = amzDates();
        const payloadHash = sha256hex(body);

        const headers = {
            host,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzdate,
        };
        if (contentType) headers['content-type'] = contentType;
        if (body.length) headers['content-length'] = String(body.length);

        const signedKeys = Object.keys(headers).filter((h) => h !== 'content-length').sort();
        const canonicalHeaders = signedKeys.map((h) => `${h}:${headers[h]}\n`).join('');
        const signedHeaders = signedKeys.join(';');

        const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
        const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;
        const stringToSign = ['AWS4-HMAC-SHA256', amzdate, scope, sha256hex(canonicalRequest)].join('\n');
        const signature = crypto.createHmac('sha256', signingKey(datestamp)).update(stringToSign).digest('hex');
        headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${ACCESS}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const req = lib.request({ method, host: base.hostname, port: base.port, path: canonicalUri, headers }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, body: buf });
                else reject(Object.assign(new Error(`S3 ${method} ${canonicalUri} → ${res.statusCode}: ${buf.toString('utf8').slice(0, 200)}`), { status: res.statusCode }));
            });
        });
        req.on('error', reject);
        if (body.length) req.write(body);
        req.end();
    });
}

async function ensureBucket(bucket) {
    try { await request('PUT', bucket, ''); }
    catch (e) { if (!/BucketAlreadyOwnedByYou|BucketAlreadyExists|409/.test(e.message)) throw e; }
}

const putObject = (bucket, key, body, contentType) => request('PUT', bucket, key, { body, contentType });
const deleteObject = (bucket, key) => request('DELETE', bucket, key);

/** Presigned GET URL (query-string SigV4). */
function presignedGetUrl(bucket, key, expires = 3600) {
    const base = new URL(ENDPOINT);
    const host = base.host;
    const { amzdate, datestamp } = amzDates();
    const scope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;
    const canonicalUri = '/' + uriEncode(bucket) + '/' + uriEncode(key, false);

    const params = {
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${ACCESS}/${scope}`,
        'X-Amz-Date': amzdate,
        'X-Amz-Expires': String(expires),
        'X-Amz-SignedHeaders': 'host',
    };
    const canonicalQuery = Object.keys(params).sort()
        .map((k) => `${uriEncode(k)}=${uriEncode(params[k])}`).join('&');
    const canonicalRequest = ['GET', canonicalUri, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const stringToSign = ['AWS4-HMAC-SHA256', amzdate, scope, sha256hex(canonicalRequest)].join('\n');
    const signature = crypto.createHmac('sha256', signingKey(datestamp)).update(stringToSign).digest('hex');

    return `${PUBLIC_URL}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

function publicUrl(bucket, key) { return `${PUBLIC_URL}/${uriEncode(bucket)}/${uriEncode(key, false)}`; }

module.exports = { ensureBucket, putObject, deleteObject, presignedGetUrl, publicUrl, ENDPOINT, PUBLIC_URL };
