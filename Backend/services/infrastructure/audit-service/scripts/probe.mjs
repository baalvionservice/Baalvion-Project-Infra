// Helper probes used by the verification sequence:
//   node scripts/probe.mjs event <action>   → prints how many audit rows match action
//   node scripts/probe.mjs verify           → prints chain verify result {ok, brokenAtSeq}
import crypto from 'crypto';
const BASE = process.env.AUDIT_URL || 'http://localhost:3032';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: 'HS256', typ: 'JWT' });
const pl = b64({ iat: now, exp: now + 3600, sub: 'u-admin', org_id: null, sid: 's', jti: 'j', roles: ['super_admin'], permissions: [] });
const token = `${h}.${pl}.${crypto.createHmac('sha256', SECRET).update(`${h}.${pl}`).digest('base64url')}`;
const get = async (p) => (await fetch(BASE + p, { headers: { authorization: `Bearer ${token}` } })).json();

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'event') {
    const r = await get(`/v1/audit?action=${encodeURIComponent(arg)}&limit=5`);
    console.log(`event '${arg}' captured: total=${r.data?.total}`, r.data?.items?.[0] ? `(actor=${r.data.items[0].actorId}, src=${r.data.items[0].sourceService})` : '');
} else if (cmd === 'verify') {
    const r = await get('/v1/audit/verify');
    console.log('verify:', JSON.stringify(r.data));
}
