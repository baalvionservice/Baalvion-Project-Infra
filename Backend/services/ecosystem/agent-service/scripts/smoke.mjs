#!/usr/bin/env node
/**
 * agent-service smoke test against a RUNNING instance (default :3044). Exercises
 * the commission tracker (direct + override chain + payout), the leaderboard, and
 * the training/certification flow. Uses a super_admin dev token.
 */
import crypto from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:3044';
const SECRET = process.env.JWT_ACCESS_SECRET || 'baalvion-dev-jwt-access-secret-do-not-use-in-prod';

function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function signJwt(payload) {
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600, jti: crypto.randomUUID(), ...payload };
    const data = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(body))}`;
    return `${data}.${b64url(crypto.createHmac('sha256', SECRET).update(data).digest())}`;
}

const TOKEN = signJwt({ sub: 'agent-smoke', userId: 'agent-smoke', org_id: 'agency-1', roles: ['super_admin'] });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { (cond ? (pass++, console.log(`  ✓ ${name}`)) : (fail++, console.log(`  ✗ ${name} ${extra}`))); }

async function req(method, path, body) {
    const res = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
    return { status: res.status, json };
}

(async () => {
    console.log(`\nagent-service smoke @ ${BASE}\n`);

    const health = await req('GET', '/health');
    ok('health', health.status === 200 && health.json.status === 'ok', JSON.stringify(health.json));

    // commission plan: 10% direct, 5% recurring, overrides 5%/2%
    const plan = await req('POST', '/v1/plans', { name: 'Standard 10%', type: 'percent', rate: 0.10, recurringPct: 0.05, overridePcts: [0.05, 0.02] });
    ok('create plan', plan.status === 201 && plan.json.data.id);
    const planId = plan.json.data.id;

    // hierarchy: lead → rep
    const lead = await req('POST', '/v1/agents', { name: 'Lead One', tier: 'lead', commissionPlanId: planId });
    ok('create parent agent', lead.status === 201 && /-/.test(lead.json.data.code));
    const leadId = lead.json.data.id;

    const rep = await req('POST', '/v1/agents', { name: 'Rep Two', tier: 'agent', parentAgentId: leadId, commissionPlanId: planId });
    ok('create child agent', rep.status === 201);
    const repId = rep.json.data.id;

    // record a $1000 sale → direct 100 to rep + override 50 to lead
    const sale = await req('POST', '/v1/sales', { agentId: repId, amount: 1000, description: 'Deal A' });
    ok('record sale accrues direct + override', sale.status === 201 && sale.json.data.commissions.length === 2, JSON.stringify(sale.json.data.commissions?.map((c) => `${c.basis}:${c.amount}`)));
    const direct = sale.json.data.commissions.find((c) => c.basis === 'direct');
    const override = sale.json.data.commissions.find((c) => c.basis === 'override');
    ok('direct commission = 100', direct && Number(direct.amount) === 100, JSON.stringify(direct?.amount));
    ok('override commission = 50', override && Number(override.amount) === 50 && override.agent_id === leadId, JSON.stringify(override?.amount));

    // recurring sale $200 → recurring 10 to rep
    await req('POST', '/v1/sales', { agentId: repId, amount: 200, kind: 'recurring', description: 'Renewal A' });

    // commission summary for the rep
    const summary = await req('GET', `/v1/commissions/summary?agentId=${repId}`);
    ok('commission summary accrued ≥ 110', summary.status === 200 && summary.json.data.accrued >= 110, JSON.stringify(summary.json.data));

    // payout the rep → paid sum, marks paid
    const payout = await req('POST', `/v1/agents/${repId}/payout`, {});
    ok('payout rep', payout.status === 200 && payout.json.data.paid >= 110 && payout.json.data.payoutRef, JSON.stringify(payout.json.data));
    const afterPay = await req('GET', `/v1/commissions/summary?agentId=${repId}`);
    ok('after payout outstanding = 0', afterPay.json.data.outstanding === 0 && afterPay.json.data.paid >= 110);

    // leaderboard by sales → rep should appear with value 1200
    const board = await req('GET', '/v1/leaderboard?metric=sales&limit=50');
    const repEntry = board.json.data.rankings.find((r) => r.agentId === repId);
    ok('leaderboard ranks rep by sales', board.status === 200 && repEntry && repEntry.value >= 1200, JSON.stringify(repEntry));

    const rank = await req('GET', `/v1/agents/${repId}/rank?metric=commission`);
    ok('agent rank lookup', rank.status === 200 && rank.json.data.found === true);

    // training: course + 2 modules
    const course = await req('POST', '/v1/courses', { title: 'Sales 101', category: 'sales', passingScore: 70 });
    ok('create course', course.status === 201);
    const courseId = course.json.data.id;
    const m1 = await req('POST', `/v1/courses/${courseId}/modules`, { title: 'Intro', position: 1 });
    const m2 = await req('POST', `/v1/courses/${courseId}/modules`, { title: 'Closing', position: 2 });
    ok('add modules', m1.status === 201 && m2.status === 201);

    const enroll = await req('POST', `/v1/courses/${courseId}/enroll`, { agentId: repId });
    ok('enroll agent', enroll.status === 201 && enroll.json.data.status === 'enrolled');

    await req('POST', `/v1/courses/${courseId}/progress`, { agentId: repId, moduleId: m1.json.data.id });
    const prog = await req('POST', `/v1/courses/${courseId}/progress`, { agentId: repId, moduleId: m2.json.data.id });
    ok('progress reaches 100%', prog.json.data.progress_pct === 100 && prog.json.data.status === 'completed');

    const score = await req('POST', `/v1/courses/${courseId}/score`, { agentId: repId, score: 85 });
    ok('passing score → certified', score.status === 200 && score.json.data.passed === true && /^CERT-/.test(score.json.data.certificate_id), JSON.stringify(score.json.data.certificate_id));

    // fail path
    await req('POST', `/v1/courses/${courseId}/enroll`, { agentId: leadId });
    const failScore = await req('POST', `/v1/courses/${courseId}/score`, { agentId: leadId, score: 40 });
    ok('failing score → failed', failScore.json.data.passed === false && failScore.json.data.status === 'failed');

    const certs = await req('GET', `/v1/agents/${repId}/certifications`);
    ok('agent certifications', certs.status === 200 && certs.json.data.length === 1 && certs.json.data[0].course === 'Sales 101');

    console.log(`\n${pass} passed, ${fail} failed\n`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('smoke crashed:', e); process.exit(1); });
