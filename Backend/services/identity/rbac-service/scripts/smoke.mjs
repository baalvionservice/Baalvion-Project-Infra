// Live end-to-end smoke test against a running rbac-service (no extra deps).
// Mints an HS256 super_admin dev token, drives the management APIs, then exercises
// the PDP: RBAC grant narrowed by an ABAC region constraint + a deny-override policy.
//   node scripts/smoke.mjs      (service must be running; reads JWT_ACCESS_SECRET/.env)
import crypto from 'crypto';

const BASE = process.env.RBAC_URL || 'http://localhost:3055';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';
const INTERNAL = process.env.INTERNAL_API_KEY || 'rbac-dev-internal-key';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function hs256(payload) {
    const now = Math.floor(Date.now() / 1000);
    const h = b64({ alg: 'HS256', typ: 'JWT' });
    const p = b64({ iat: now, exp: now + 3600, ...payload });
    const sig = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    return `${h}.${p}.${sig}`;
}
const adminToken = hs256({ sub: 'u-admin', email: 'admin@baalvion.com', org_id: null, sid: 'sess-admin', jti: 'jti-admin', roles: ['super_admin'], permissions: [] });

let pass = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`, JSON.stringify(extra ?? '')); } };

async function api(method, path, { token, internal, body } = {}) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    if (internal) headers['x-internal-key'] = INTERNAL;
    const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
}

(async () => {
    const tenants = await api('GET', '/v1/tenants?type=platform', { token: adminToken });
    const platform = tenants.json.data?.[0];
    check('list platform tenant (auth works)', tenants.status === 200 && platform?.type === 'platform', tenants.json);

    await api('POST', '/v1/permissions', { token: adminToken, body: { resource: 'finance.record', action: 'read', module: 'finance' } });
    const perms = await api('GET', '/v1/permissions?resource=finance.record', { token: adminToken });
    const permId = perms.json.data?.find((p) => p.action === 'read')?.id;
    check('create + list permission finance.record:read', !!permId, perms.json);

    let role = await api('POST', '/v1/roles', { token: adminToken, body: { tenantId: platform.id, key: 'finance_manager', name: 'Finance Manager', scopeType: 'organization', level: 250 } });
    if (role.status === 409) { const l = await api('GET', `/v1/roles?tenantId=${platform.id}&key=finance_manager`, { token: adminToken }); role = { json: { data: l.json.data?.[0] } }; }
    const roleId = role.json.data?.id;
    check('create role finance_manager (RBAC)', !!roleId, role.json);

    const attach = await api('POST', `/v1/roles/${roleId}/permissions`, { token: adminToken, body: { permissionId: permId, effect: 'allow', constraints: { '==': [{ var: 'resource.region' }, { var: 'subject.region' }] } } });
    check('attach grant + ABAC region constraint', [200, 201].includes(attach.status), attach.json);

    const assign = await api('POST', '/v1/assignments', { token: adminToken, body: { userId: 'u-fm', roleId, scopeId: 'org-1' } });
    check('assign finance_manager → u-fm @ org-1 (scoped guard)', [200, 201].includes(assign.status), assign.json);

    const attr = await api('PUT', '/v1/users/u-fm/attributes', { token: adminToken, body: { key: 'region', value: 'apac' } });
    check('set subject attribute region=apac', [200, 201].includes(attr.status), attr.json);

    const allow = await api('POST', '/v1/authorize', { internal: true, body: { subject: { id: 'u-fm' }, action: 'read', resource: { type: 'finance.record', attributes: { region: 'apac' } }, scopeId: 'org-1' } });
    check('PDP: own-region record → ALLOW', allow.json.data?.decision === 'allow', allow.json.data);

    const deny = await api('POST', '/v1/authorize', { internal: true, body: { subject: { id: 'u-fm' }, action: 'read', resource: { type: 'finance.record', attributes: { region: 'emea' } }, scopeId: 'org-1' } });
    check('PDP: cross-region record → DENY (ABAC narrows RBAC)', deny.json.data?.decision === 'deny', deny.json.data);

    const sa = await api('POST', '/v1/authorize', { internal: true, body: { subject: { id: 'u-admin', roles: ['super_admin'] }, action: 'delete', resource: { type: 'anything' } } });
    check('PDP: super_admin → ALLOW any', sa.json.data?.decision === 'allow', sa.json.data);

    await api('PUT', '/v1/users/u-fm/attributes', { token: adminToken, body: { key: 'status', value: 'suspended' } });
    const susp = await api('POST', '/v1/authorize', { internal: true, body: { subject: { id: 'u-fm' }, action: 'read', resource: { type: 'finance.record', attributes: { region: 'apac' } }, scopeId: 'org-1' } });
    check('PDP: suspended subject → DENY (deny-override policy)', susp.json.data?.decision === 'deny', susp.json.data);
    // cleanup so re-runs are idempotent
    await api('PUT', '/v1/users/u-fm/attributes', { token: adminToken, body: { key: 'status', value: 'active' } });

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})();
