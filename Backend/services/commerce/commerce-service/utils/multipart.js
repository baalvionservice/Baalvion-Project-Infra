'use strict';
/**
 * Minimal, dependency-free multipart/form-data parser using only Node built-ins.
 *
 * The global express.json() body parser skips non-JSON content types, so a
 * multipart request reaches the route handler with its stream intact; we buffer
 * it here and split on the MIME boundary (binary-safe). Avoids pulling in
 * multer/busboy, which aren't dependencies of this service.
 */

/** Read the raw request body into a single Buffer, with a hard size cap. */
function readRawBody(req, limitBytes = 25 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', (c) => {
            size += c.length;
            if (size > limitBytes) {
                reject(Object.assign(new Error('Payload too large'), { statusCode: 413, code: 'PAYLOAD_TOO_LARGE' }));
                req.destroy();
                return;
            }
            chunks.push(c);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

/**
 * Parse a multipart buffer into parts:
 *   [{ name, filename|null, contentType|null, data: Buffer }]
 */
function parseMultipart(buffer, contentTypeHeader) {
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentTypeHeader || '');
    if (!m) throw Object.assign(new Error('Missing multipart boundary'), { statusCode: 400, code: 'BAD_MULTIPART' });
    const marker = Buffer.from('--' + (m[1] || m[2]).trim());

    const parts = [];
    let start = buffer.indexOf(marker);
    while (start !== -1) {
        const next = buffer.indexOf(marker, start + marker.length);
        if (next === -1) break;

        let segStart = start + marker.length;
        // A closing boundary is "--boundary--"; the bytes right after the marker are "--".
        if (buffer[segStart] === 0x2d && buffer[segStart + 1] === 0x2d) break;
        segStart += 2;                 // skip the CRLF after the boundary marker
        const segEnd = next - 2;       // strip the CRLF that precedes the next boundary
        if (segEnd <= segStart) { start = next; continue; }

        const seg = buffer.slice(segStart, segEnd);
        const sep = seg.indexOf('\r\n\r\n');
        if (sep !== -1) {
            const headerStr = seg.slice(0, sep).toString('utf8');
            const data = seg.slice(sep + 4);
            const nameM = /name="([^"]*)"/i.exec(headerStr);
            const fileM = /filename="([^"]*)"/i.exec(headerStr);
            const ctM   = /Content-Type:\s*([^\r\n]+)/i.exec(headerStr);
            parts.push({
                name:        nameM ? nameM[1] : null,
                filename:    fileM ? fileM[1] : null,
                contentType: ctM ? ctM[1].trim() : null,
                data,
            });
        }
        start = next;
    }
    return parts;
}

module.exports = { readRawBody, parseMultipart };
