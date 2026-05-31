#!/usr/bin/env node
/**
 * report-service smoke test. Boots nothing — it exercises a RUNNING instance
 * (default http://localhost:3041). Mints a dev HS256 token with the shared dev
 * secret so the canonical verifier accepts it locally.
 *
 *   node scripts/smoke.mjs            # against :3041
 *   BASE=http://localhost:3041 node scripts/smoke.mjs
 */
import crypto from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:3041';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';

function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function signJwt(payload) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600, jti: crypto.randomUUID(), ...payload };
    const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
    const sig = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
    return `${data}.${sig}`;
}

const TOKEN = signJwt({ sub: 'smoke-user', userId: 'smoke-user', org_id: 'smoke-org', roles: ['admin'], permissions: [] });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { (cond ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name} ${extra}`))); }

async function req(method, path, body, raw = false) {
    const res = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    if (raw) return { status: res.status, text, ct: res.headers.get('content-type') };
    let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

(async () => {
    console.log(`\nreport-service smoke @ ${BASE}\n`);

    const health = await req('GET', '/health');
    ok('health', health.status === 200 && health.json.status === 'ok', JSON.stringify(health.json));

    const formats = await req('GET', '/v1/formats');
    ok('formats list', formats.status === 200 && formats.json.data.formats.includes('pdf'));

    // Create a definition with a parameterized read-only query (no table dependency).
    const create = await req('POST', '/v1/reports', {
        name: 'Smoke Series Report',
        category: 'smoke',
        source_type: 'query',
        query_template: "SELECT n AS num, ('row ' || n) AS label, (n * 1.5) AS amount FROM generate_series(:from::int, :to::int) AS n",
        params_schema: [{ name: 'from', type: 'integer', required: true }, { name: 'to', type: 'integer', required: true }],
        columns: [{ key: 'num', label: 'Number' }, { key: 'label', label: 'Label' }, { key: 'amount', label: 'Amount' }],
        default_format: 'csv',
    });
    ok('create definition', create.status === 201 && !!create.json.data.id, JSON.stringify(create.json));
    const defId = create.json.data?.id;

    // Reject a non-SELECT query at create time.
    const bad = await req('POST', '/v1/reports', { name: 'evil', source_type: 'query', query_template: 'DELETE FROM reports.report_runs' });
    ok('rejects write query', bad.status >= 400);

    // Preview (json rows for the builder).
    const prev = await req('POST', `/v1/reports/${defId}/preview`, { params: { from: 1, to: 5 } });
    ok('preview returns 5 rows', prev.status === 200 && prev.json.data.rowCount === 5, JSON.stringify(prev.json.data?.rowCount));

    // Run + download CSV.
    const csv = await req('POST', `/v1/reports/${defId}/run?download=1`, { format: 'csv', params: { from: 1, to: 3 } }, true);
    ok('CSV export', csv.status === 200 && csv.ct?.includes('text/csv') && /Number,Label,Amount/.test(csv.text), csv.text.slice(0, 60));

    // Run JSON (persisted) → get a run id → download.
    const runJson = await req('POST', `/v1/reports/${defId}/run`, { format: 'json', params: { from: 1, to: 10 } });
    ok('run persisted', runJson.status === 201 && runJson.json.data.run?.status === 'completed' && runJson.json.data.rowCount === 10);
    const runId = runJson.json.data.run?.id;

    const dl = await req('GET', `/v1/runs/${runId}/download`, null, true);
    ok('download persisted run', dl.status === 200 && dl.text.includes('"rows"'));

    // Excel / PDF (optional deps) — accept either success or a clean 501.
    const xlsx = await req('POST', `/v1/reports/${defId}/run?download=1`, { format: 'xlsx', params: { from: 1, to: 3 } }, true);
    ok('Excel export (or clean 501)', xlsx.status === 200 || xlsx.status === 501, `status=${xlsx.status}`);
    const pdf = await req('POST', `/v1/reports/${defId}/run?download=1`, { format: 'pdf', params: { from: 1, to: 3 } }, true);
    ok('PDF export (or clean 501)', pdf.status === 200 || pdf.status === 501, `status=${pdf.status}`);

    // Schedule.
    const sched = await req('POST', `/v1/reports/${defId}/schedules`, { cadence: 'daily', at_hour: 6, at_minute: 0, format: 'csv', params: { from: 1, to: 100 } });
    ok('create schedule', sched.status === 201 && !!sched.json.data.next_run_at, JSON.stringify(sched.json.data?.next_run_at));

    const list = await req('GET', '/v1/reports?category=smoke');
    ok('list definitions', list.status === 200 && list.json.data.total >= 1);

    const runs = await req('GET', `/v1/reports/${defId}/runs`);
    ok('list runs', runs.status === 200 && runs.json.data.total >= 2);

    // Cleanup
    await req('DELETE', `/v1/reports/${defId}`);

    console.log(`\n${pass} passed, ${fail} failed\n`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('smoke crashed:', e); process.exit(1); });
