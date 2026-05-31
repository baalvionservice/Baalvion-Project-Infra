#!/usr/bin/env node
/**
 * developer-service smoke test against a RUNNING instance (default :3042). Spins up
 * a local receiver so signed webhook delivery is proven end-to-end (signature is
 * verified against the endpoint secret). Mints a dev HS256 token + uses the dev
 * internal key for the gateway verify path.
 */
import crypto from 'node:crypto';
import http from 'node:http';

const BASE = process.env.BASE || 'http://localhost:3042';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';
const INTERNAL = process.env.INTERNAL_API_KEY || 'developer-dev-internal-key';

function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function signJwt(payload) {
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600, jti: crypto.randomUUID(), ...payload };
    const data = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(body))}`;
    return `${data}.${b64url(crypto.createHmac('sha256', SECRET).update(data).digest())}`;
}
function verifySig(secret, body, header) {
    const parts = Object.fromEntries(String(header).split(',').map((kv) => kv.split('=')));
    const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${body}`).digest('hex');
    return expected === parts.v1;
}

const TOKEN = signJwt({ sub: 'dev-smoke', userId: 'dev-smoke', org_id: 'dev-org', roles: ['developer'] });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const HI = { 'X-Internal-Key': INTERNAL, 'Content-Type': 'application/json' };

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { (cond ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name} ${extra}`))); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, path, body, headers = H) {
    const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

// ── local webhook receiver ──
const received = [];
const receiver = http.createServer((rq, rs) => {
    let body = '';
    rq.on('data', (d) => (body += d));
    rq.on('end', () => { received.push({ headers: rq.headers, body }); rs.writeHead(200); rs.end('ok'); });
});
await new Promise((r) => receiver.listen(0, r));
const RECV_URL = `http://127.0.0.1:${receiver.address().port}/hook`;

(async () => {
    console.log(`\ndeveloper-service smoke @ ${BASE}\n`);

    const health = await req('GET', '/health');
    ok('health', health.status === 200 && health.json.status === 'ok', JSON.stringify(health.json));

    // ── API keys ──
    const issued = await req('POST', '/v1/keys', { name: 'smoke key', mode: 'live', scopes: ['read', 'write'] });
    ok('issue key (plaintext once)', issued.status === 201 && /^bk_live_/.test(issued.json.data.key) && !issued.json.data.key_hash, JSON.stringify(issued.json).slice(0, 80));
    const key = issued.json.data.key; const keyId = issued.json.data.id;

    const verifyOk = await req('POST', '/v1/keys/verify', { key }, HI);
    ok('verify valid key (internal)', verifyOk.status === 200 && verifyOk.json.data.valid === true && verifyOk.json.data.orgId === 'dev-org', JSON.stringify(verifyOk.json.data));

    const verifyBad = await req('POST', '/v1/keys/verify', { key: 'bk_live_totallybogus000' }, HI);
    ok('verify rejects unknown key', verifyBad.status === 200 && verifyBad.json.data.valid === false);

    const verifyNoInternal = await req('POST', '/v1/keys/verify', { key }, H);
    ok('verify requires internal key', verifyNoInternal.status === 403);

    const rotated = await req('POST', `/v1/keys/${keyId}/rotate`);
    ok('rotate key', rotated.status === 200 && rotated.json.data.key !== key && /^bk_live_/.test(rotated.json.data.key));
    const oldInvalid = await req('POST', '/v1/keys/verify', { key }, HI);
    ok('old key invalid after rotate', oldInvalid.json.data.valid === false);

    await req('POST', `/v1/keys/${keyId}/revoke`);
    const revokedCheck = await req('POST', '/v1/keys/verify', { key: rotated.json.data.key }, HI);
    ok('revoked key invalid', revokedCheck.json.data.valid === false && revokedCheck.json.data.reason === 'revoked');

    // ── webhooks: signed delivery ──
    const ep = await req('POST', '/v1/webhooks', { url: RECV_URL, events: ['*'], description: 'smoke' });
    ok('create webhook endpoint', ep.status === 201 && /^whsec_/.test(ep.json.data.secret));
    const epId = ep.json.data.id; const epSecret = ep.json.data.secret;

    received.length = 0;
    const test = await req('POST', `/v1/webhooks/${epId}/test`, { eventType: 'ping' });
    ok('send test → delivered', test.status === 200 && test.json.data.status === 'delivered', JSON.stringify(test.json.data));
    await sleep(200);
    ok('receiver got signed delivery', received.length >= 1 && verifySig(epSecret, received[0].body, received[0].headers['x-baalvion-signature']), `recv=${received.length}`);

    // ── dispatch → async delivery via worker ──
    received.length = 0;
    const ep2 = await req('POST', '/v1/webhooks', { url: RECV_URL, events: ['smoke.event'] });
    const disp = await req('POST', '/v1/events/dispatch', { orgId: 'dev-org', eventType: 'smoke.event', payload: { hello: 'world' } });
    ok('dispatch fans out', disp.status === 201 && disp.json.data.dispatched >= 1, JSON.stringify(disp.json.data));
    let delivered = false;
    for (let i = 0; i < 15 && !delivered; i++) { await sleep(1000); delivered = received.length >= 1; }
    ok('worker delivered dispatched event', delivered, `recv=${received.length}`);

    const dels = await req('GET', `/v1/webhooks/${epId}/deliveries`);
    ok('list deliveries', dels.status === 200 && dels.json.data.total >= 1);

    // ── OpenAPI spec catalog ──
    const spec = await req('POST', '/v1/specs', { service: 'smoke-svc', isPublic: true, spec: { openapi: '3.0.0', info: { title: 'Smoke API', version: '1.0.0' }, paths: {} } });
    ok('register spec', spec.status === 201 && spec.json.data.service === 'smoke-svc');
    const pub = await req('GET', '/v1/public/specs/smoke-svc', null, { 'Content-Type': 'application/json' });
    ok('public spec served raw', pub.status === 200 && pub.json.openapi === '3.0.0');

    const evTypes = await req('GET', '/v1/event-types');
    ok('event-type registry seeded', evTypes.status === 200 && evTypes.json.data.eventTypes.length >= 10);

    const echo = await req('POST', '/v1/sandbox/echo', { test: 1 });
    ok('sandbox echo', echo.status === 200 && echo.json.data.sandbox === true);

    // cleanup
    await req('DELETE', `/v1/webhooks/${epId}`);
    await req('DELETE', `/v1/webhooks/${ep2.json.data.id}`);
    await req('DELETE', '/v1/specs/smoke-svc');

    receiver.close();
    console.log(`\n${pass} passed, ${fail} failed\n`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('smoke crashed:', e); receiver.close(); process.exit(1); });
