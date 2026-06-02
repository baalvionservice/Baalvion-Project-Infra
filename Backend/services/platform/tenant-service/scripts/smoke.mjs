#!/usr/bin/env node
/**
 * tenant-service smoke test against a RUNNING instance (default :3043). Uses a
 * super_admin dev token so it can force-verify a domain (no real DNS) and act
 * platform-wide.
 */
import crypto from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:3043';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';

function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function signJwt(payload) {
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600, jti: crypto.randomUUID(), ...payload };
    const data = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(body))}`;
    return `${data}.${b64url(crypto.createHmac('sha256', SECRET).update(data).digest())}`;
}

const TOKEN = signJwt({ sub: 'tenant-smoke', userId: 'tenant-smoke', org_id: 'plat', roles: ['super_admin'] });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { (cond ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name} ${extra}`))); }

async function req(method, path, body, headers = H) {
    const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

(async () => {
    console.log(`\ntenant-service smoke @ ${BASE}\n`);
    const slug = `acme-${crypto.randomBytes(3).toString('hex')}`;
    const domain = `${slug}.example.com`;

    const health = await req('GET', '/health');
    ok('health', health.status === 200 && health.json.status === 'ok', JSON.stringify(health.json));

    // provision a full white-label tenant in one call
    const prov = await req('POST', '/v1/tenants/provision', {
        slug, name: 'Acme Corp', plan: 'enterprise',
        branding: { brandName: 'Acme', primaryColor: '#FF6600', supportEmail: 'help@acme.test' },
        entitlements: [{ featureKey: 'seats', limitValue: 25 }, { featureKey: 'feature.sso', enabled: true }],
    });
    ok('provision tenant', prov.status === 201 && prov.json.data.id && prov.json.data.branding.length === 1 && prov.json.data.entitlements.length === 2, JSON.stringify(prov.json).slice(0, 100));
    const tid = prov.json.data.id;

    // duplicate slug rejected
    const dup = await req('POST', '/v1/tenants', { slug, name: 'dupe' });
    ok('duplicate slug rejected', dup.status === 409);

    // per-app branding
    const brand = await req('PUT', `/v1/tenants/${tid}/branding`, { app: 'login', brandName: 'Acme Login', primaryColor: '#0066FF', loginBgUrl: 'https://cdn.acme.test/bg.png' });
    ok('upsert per-app branding', brand.status === 201 && brand.json.data.app === 'login');

    // custom domain → verify (force, super_admin)
    const add = await req('POST', `/v1/tenants/${tid}/domains`, { domain, app: 'login' });
    ok('add domain (verify token issued)', add.status === 201 && /baalvion-verify=/.test(add.json.data.verifyToken));
    const domainId = add.json.data.id;

    const verifyFail = await req('POST', `/v1/tenants/${tid}/domains/${domainId}/verify`, {});
    ok('verify fails before DNS record', verifyFail.status === 400);

    const verify = await req('POST', `/v1/tenants/${tid}/domains/${domainId}/verify?force=true`, {});
    ok('force-verify domain (super_admin)', verify.status === 200 && verify.json.data.verified === true);

    // public resolve by domain → app-specific branding
    const resolve = await req('GET', `/v1/resolve?domain=${domain}&app=login`, null, { 'Content-Type': 'application/json' });
    ok('public resolve by domain', resolve.status === 200 && resolve.json.data.brandName === 'Acme Login' && resolve.json.data.primaryColor === '#0066FF', JSON.stringify(resolve.json.data));

    // entitlements: check + consume + quota
    const check = await req('GET', `/v1/tenants/${tid}/entitlements/seats/check`);
    ok('check entitlement', check.status === 200 && check.json.data.limit === 25 && check.json.data.allowed === true);

    const consume = await req('POST', `/v1/tenants/${tid}/entitlements/seats/consume`, { amount: 25 });
    ok('consume up to limit', consume.status === 200 && consume.json.data.used === 25);

    const over = await req('POST', `/v1/tenants/${tid}/entitlements/seats/consume`, { amount: 1 });
    ok('quota exceeded → 429', over.status === 429, `status=${over.status}`);

    // suspend → resolve should 404 (inactive)
    await req('POST', `/v1/tenants/${tid}/status`, { status: 'suspended' });
    const resolveSuspended = await req('GET', `/v1/resolve?domain=${domain}`, null, { 'Content-Type': 'application/json' });
    ok('suspended tenant not resolvable', resolveSuspended.status === 404);

    // list + get
    const list = await req('GET', '/v1/tenants?status=suspended');
    ok('list tenants', list.status === 200 && list.json.data.total >= 1);

    // cleanup
    await req('DELETE', `/v1/tenants/${tid}`);

    console.log(`\n${pass} passed, ${fail} failed\n`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('smoke crashed:', e); process.exit(1); });
