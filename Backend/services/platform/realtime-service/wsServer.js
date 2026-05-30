'use strict';
/**
 * Minimal RFC 6455 WebSocket server using only Node built-ins (http + crypto).
 *
 * The `ws` package isn't available in this workspace, so we implement just enough
 * of the protocol for the admin console's realtime feed: the opening handshake,
 * binary-safe frame decode of masked client text frames, and unmasked server text
 * frames. No permessage-deflate, no fragmentation beyond what we reassemble here.
 */
const crypto = require('crypto');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function acceptKey(secWsKey) {
    return crypto.createHash('sha1').update(secWsKey + GUID).digest('base64');
}

/** Encode a server→client TEXT frame (unmasked). */
function encodeText(str) {
    const payload = Buffer.from(str, 'utf8');
    const len = payload.length;
    let header;
    if (len < 126) {
        header = Buffer.from([0x81, len]);
    } else if (len < 65536) {
        header = Buffer.from([0x81, 126, (len >> 8) & 0xff, len & 0xff]);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x81; header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }
    return Buffer.concat([header, payload]);
}

/** Encode a control frame (close/pong). opcode: 0x8 close, 0xA pong. */
function encodeControl(opcode, payload = Buffer.alloc(0)) {
    return Buffer.concat([Buffer.from([0x80 | opcode, payload.length & 0x7f]), payload]);
}

/**
 * Pull complete frames out of an accumulating buffer.
 * Returns { frames: [{opcode, payload}], rest: Buffer } where `rest` is the
 * leftover bytes of an incomplete trailing frame.
 */
function drainFrames(buf) {
    const frames = [];
    let offset = 0;
    while (offset + 2 <= buf.length) {
        const b0 = buf[offset];
        const b1 = buf[offset + 1];
        const opcode = b0 & 0x0f;
        const masked = (b1 & 0x80) === 0x80;
        let len = b1 & 0x7f;
        let p = offset + 2;

        if (len === 126) {
            if (p + 2 > buf.length) break;
            len = buf.readUInt16BE(p); p += 2;
        } else if (len === 127) {
            if (p + 8 > buf.length) break;
            len = Number(buf.readBigUInt64BE(p)); p += 8;
        }

        let maskKey = null;
        if (masked) {
            if (p + 4 > buf.length) break;
            maskKey = buf.slice(p, p + 4); p += 4;
        }
        if (p + len > buf.length) break; // incomplete payload

        let payload = buf.slice(p, p + len);
        if (masked && maskKey) {
            const out = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i & 3];
            payload = out;
        }
        frames.push({ opcode, payload });
        offset = p + len;
    }
    return { frames, rest: buf.slice(offset) };
}

/**
 * Attach a WebSocket endpoint to an http.Server.
 *   opts.verifyUpgrade(req) -> truthy context or null (reject)
 *   opts.onConnection(client)         — client = { send(obj), close(), ctx, socket }
 *   opts.onMessage(client, parsedJson) — for application frames
 */
function attachWebSocket(httpServer, opts) {
    const clients = new Set();
    let bytesIn = 0, bytesOut = 0;

    httpServer.on('upgrade', (req, socket) => {
        const key = req.headers['sec-websocket-key'];
        if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') {
            socket.destroy(); return;
        }
        const ctx = opts.verifyUpgrade ? opts.verifyUpgrade(req) : {};
        if (!ctx) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy(); return;
        }

        socket.write(
            'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${acceptKey(key)}\r\n\r\n`
        );

        const client = {
            ctx,
            socket,
            alive: true,
            send(obj) {
                if (!this.alive) return;
                try { const f = encodeText(typeof obj === 'string' ? obj : JSON.stringify(obj)); bytesOut += f.length; socket.write(f); } catch { /* gone */ }
            },
            close() { try { socket.write(encodeControl(0x8)); } catch {} try { socket.end(); } catch {} },
        };
        clients.add(client);

        let acc = Buffer.alloc(0);
        socket.on('data', (chunk) => {
            bytesIn += chunk.length;
            acc = Buffer.concat([acc, chunk]);
            const { frames, rest } = drainFrames(acc);
            acc = rest;
            for (const f of frames) {
                if (f.opcode === 0x8) { client.alive = false; clients.delete(client); try { socket.end(); } catch {} return; } // close
                if (f.opcode === 0x9) { try { socket.write(encodeControl(0xA, f.payload)); } catch {} continue; }   // ping → pong
                if (f.opcode === 0xA) continue;                                                                     // pong
                if (f.opcode === 0x1) {                                                                             // text
                    let msg = null;
                    try { msg = JSON.parse(f.payload.toString('utf8')); } catch { continue; }
                    if (opts.onMessage) opts.onMessage(client, msg);
                }
            }
        });
        const cleanup = () => { client.alive = false; clients.delete(client); };
        socket.on('close', cleanup);
        socket.on('error', cleanup);

        if (opts.onConnection) opts.onConnection(client);
    });

    return {
        clients,
        broadcast(obj) {
            const frame = encodeText(typeof obj === 'string' ? obj : JSON.stringify(obj));
            for (const c of clients) { if (c.alive) { try { c.socket.write(frame); bytesOut += frame.length; } catch { /* gone */ } } }
        },
        /** Returns bytes since last call and resets the counters. */
        readBytes() { const v = { in: bytesIn, out: bytesOut }; bytesIn = 0; bytesOut = 0; return v; },
        get count() { return clients.size; },
    };
}

module.exports = { attachWebSocket };
