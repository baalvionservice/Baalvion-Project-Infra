// Live E2E against a running search-service. Skips gracefully if OpenSearch is down.
//   node scripts/smoke.mjs
import crypto from 'crypto';

const BASE = process.env.SEARCH_URL || 'http://localhost:3036';
const SECRET = process.env.JWT_ACCESS_SECRET || 'dev-insecure-search-secret';
const INTERNAL = process.env.INTERNAL_API_KEY || 'search-dev-internal-key';
const IDX = 'baalvion_products';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function tok(claims) {
    const now = Math.floor(Date.now() / 1000);
    const h = b64({ alg: 'HS256', typ: 'JWT' });
    const p = b64({ iat: now, exp: now + 3600, sid: 's', jti: crypto.randomUUID(), ...claims });
    return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
}
const superTok = tok({ sub: 'u-admin', roles: ['super_admin'], org_id: null });
const aTok = tok({ sub: 'u-a', roles: ['member'], org_id: 'org-a' });
const bTok = tok({ sub: 'u-b', roles: ['member'], org_id: 'org-b' });

let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log(`  ✗ ${n} (got ${JSON.stringify(got)})`); } };
async function api(method, path, { token, internal, body } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    if (internal) headers['x-internal-key'] = INTERNAL;
    const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, json: await res.json().catch(() => ({})) };
}

(async () => {
    const health = await fetch(BASE + '/health').then((r) => r.json()).catch(() => ({}));
    if (health.status !== 'ok') {
        console.log(`OpenSearch not reachable (health=${health.status}) — skipping E2E. The service boots degraded, which is the correct behavior. Bring up OpenSearch and re-run.`);
        process.exit(0);
    }

    await api('POST', '/v1/admin/indices', { internal: true });
    const prod = (name, orgId) => ({ name, description: `${name} desc`, category: 'gadgets', price: 9.99, sku: name, stockLevel: 5, isActive: true, orgId });
    await api('POST', `/v1/index/${IDX}`, { internal: true, body: { id: 'p1', doc: prod('Alpha Widget', 'org-a') } });
    await api('POST', `/v1/index/${IDX}`, { internal: true, body: { id: 'p2', doc: prod('Alpha Gadget', 'org-a') } });
    await api('POST', `/v1/index/${IDX}`, { internal: true, body: { id: 'p3', doc: prod('Beta Widget', 'org-b') } });
    await new Promise((r) => setTimeout(r, 400));

    const a = await api('GET', `/v1/search/${IDX}?q=widget`, { token: aTok });
    ok('tenant org-a searching "widget" sees only its own doc', a.json.data?.total === 1 && a.json.data?.hits?.[0]?.source?.orgId === 'org-a', a.json.data?.total);

    const b = await api('GET', `/v1/search/${IDX}?q=widget`, { token: bTok });
    ok('tenant org-b sees only its own doc', b.json.data?.total === 1 && b.json.data?.hits?.[0]?.source?.orgId === 'org-b', b.json.data?.total);

    const all = await api('GET', `/v1/search/${IDX}?q=widget`, { token: superTok });
    ok('super_admin (bypass) sees both tenants', all.json.data?.total === 2, all.json.data?.total);

    const fuzzy = await api('GET', `/v1/search/${IDX}?q=widgett&fuzzy=true`, { token: superTok });
    ok('fuzzy matches misspelled "widgett"', (fuzzy.json.data?.total || 0) >= 2, fuzzy.json.data?.total);

    // autocomplete lowercases the prefix → target the analyzed `name` field (lowercased tokens),
    // not the case-sensitive `name.keyword`.
    const ac = await api('GET', `/v1/autocomplete/${IDX}?field=name&prefix=alpha`, { token: superTok });
    ok('autocomplete prefix "alpha" returns 2', (ac.json.data?.total || 0) === 2, ac.json.data?.total);

    // cleanup
    for (const id of ['p1', 'p2', 'p3']) await api('DELETE', `/v1/index/${IDX}/${id}`, { internal: true });

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
