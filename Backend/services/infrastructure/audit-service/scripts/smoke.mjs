// Live end-to-end smoke test against a running audit-service (no extra deps).
//   node scripts/smoke.mjs
import crypto from 'crypto';

const BASE = process.env.AUDIT_URL || 'http://localhost:3032';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function hs256(p) {
    const now = Math.floor(Date.now() / 1000);
    const h = b64({ alg: 'HS256', typ: 'JWT' });
    const pl = b64({ iat: now, exp: now + 3600, ...p });
    const sig = crypto.createHmac('sha256', SECRET).update(`${h}.${pl}`).digest('base64url');
    return `${h}.${pl}.${sig}`;
}
const token = hs256({ sub: 'u-admin', email: 'admin@baalvion.com', org_id: null, sid: 's', jti: 'j', roles: ['super_admin'], permissions: [] });

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n, JSON.stringify(x ?? '')); } };
async function api(method, path, body) {
    const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}

(async () => {
    const corr = `smoke-${Date.now()}`;
    const a = await api('POST', '/v1/audit', { action: 'user.login', actorId: 'u-100', ip: '1.2.3.4', outcome: 'success', sourceService: 'smoke', correlationId: corr, metadata: { device: 'cli' } });
    ok('append event #1 (returns hash)', a.status === 201 && /^[0-9a-f]{64}$/.test(a.json.data?.hash || ''), a.json);

    const b = await api('POST', '/v1/audit', { action: 'role.assigned', actorId: 'u-100', resourceType: 'role', resourceId: 'finance_manager', severity: 'medium', correlationId: corr, metadata: { by: 'u-admin' } });
    ok('append event #2 (chains to #1)', b.status === 201 && b.json.data?.prevHash === a.json.data?.hash, { prev: b.json.data?.prevHash, expected: a.json.data?.hash });

    const list = await api('GET', '/v1/audit?actorId=u-100&limit=10');
    ok('query by actor returns both events', list.status === 200 && list.json.data?.total >= 2, list.json.data?.total);

    const verify = await api('GET', '/v1/audit/verify');
    ok('chain verifies OK', verify.json.data?.ok === true && verify.json.data?.checked >= 2, verify.json.data);

    // unauthenticated read is rejected
    const noauth = await fetch(BASE + '/v1/audit').then((r) => r.status);
    ok('reads require auth (401 without token)', noauth === 401, noauth);

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
