/**
 * Deal-room tenant isolation + authorization — standalone verification harness.
 *
 * Runs the full lifecycle against a LIVE marketplace-service that is connected as the
 * NON-superuser baalvion_app role, so the RLS policies (migrations 002/004/005/006/007) are
 * genuinely enforced rather than bypassed. Alongside the happy path it replays each authz hole
 * this suite was written to close, and asserts every one is now refused.
 *
 * Prerequisites:
 *   docker compose up -d postgres                         (baalvion-postgres, :5432)
 *   node scripts/gen-dev-jwt-keys.mjs                     (repo root — dev RS256 keypair)
 *   node scripts/migrate.js                               (as the schema owner)
 *   psql -f tests/fixtures/dealroom-seed.sql              (one company round, as the owner)
 *   ...re-apply that fixture before EACH run: the suite closes the round it exercises.
 *   PORT=3062 DB_USER=baalvion_app DB_PASSWORD=... JWT_PUBLIC_KEY="$(cat docker/secrets/jwt_public_key.pem)" node index.js
 *
 * Run: node tests/dealroom-isolation.verify.js
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

const API = (process.env.MARKETPLACE_URL || 'http://127.0.0.1:3060') + '/api/v1';
const KEY = process.env.JWT_PRIVATE_KEY_FILE
  || new URL('../../../../../docker/secrets/jwt_private_key.pem', import.meta.url).pathname;
const PRIV = fs.readFileSync(KEY, 'utf8');

const ORG_COMPANY = 'aaaaaaaa-0000-4000-8000-000000000001';
const ORG_INV_A = 'bbbbbbbb-0000-4000-8000-00000000000a';
const ORG_INV_B = 'cccccccc-0000-4000-8000-00000000000b';
const ORG_INV_C = 'dddddddd-0000-4000-8000-00000000000c';  // seeded UNVERIFIED on purpose
const OPPORTUNITY = '22222222-0000-4000-8000-000000000001';

const b64 = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function mint({ sub, org, roles = ['investor_admin'] }) {
  const now = Math.floor(Date.now() / 1000);
  const h = { alg: 'RS256', typ: 'JWT', kid: 'dev' };
  const p = { sub, email: `${sub}@baalvion.test`, ...(org ? { org_id: org } : {}), sid: 'sess-' + crypto.randomUUID(), roles,
              permissions: [], jti: crypto.randomUUID(), iss: 'baalvion-auth', aud: 'baalvion-platform', iat: now, exp: now + 3600 };
  const input = b64(JSON.stringify(h)) + '.' + b64(JSON.stringify(p));
  return input + '.' + b64(crypto.sign('RSA-SHA256', Buffer.from(input), PRIV));
}

const TOK = {
  investorA: mint({ sub: 'user-inv-a', org: ORG_INV_A }),
  investorB: mint({ sub: 'user-inv-b', org: ORG_INV_B }),
  company:   mint({ sub: 'user-founder', org: ORG_COMPANY, roles: ['company_admin'] }),
  compliance: mint({ sub: 'user-compliance', org: ORG_COMPANY, roles: ['compliance'] }),
  orgless:    mint({ sub: 'user-orgless', org: null }),
  investorB2: mint({ sub: 'user-inv-b2', org: ORG_INV_B }),
  investorC:  mint({ sub: 'user-inv-c', org: ORG_INV_C }),
};

async function call(who, path, method = 'GET', body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOK[who]}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✔ ${name}`); }
  else { fail++; console.log(`  ✘ ${name}${detail ? `  → ${detail}` : ''}`); }
};

// The suite closes the round it runs against (escrow release closes the opportunity), so the
// fixture has to be re-applied between runs. Fail fast with the reason rather than emitting
// dozens of downstream failures that all trace back to one stale row.
let fixture = null;
try {
  fixture = await fetch(`${API}/opportunities/${OPPORTUNITY}`).then((r) => r.json());
} catch (err) {
  // Distinguish "cannot reach the service" from "fixture is stale" — one diagnostic standing in
  // for the other sends you looking in entirely the wrong place.
  console.error(`\nCannot reach marketplace-service at ${API} — ${err.message}`);
  console.error('Start it (see the header of this file) or set MARKETPLACE_URL.\n');
  process.exit(2);
}
if (!fixture?.data || fixture.data.status !== 'live') {
  console.error('\nFixture not ready — the demo round is missing or no longer live.');
  console.error(`Service answered with: ${JSON.stringify(fixture).slice(0, 160)}`);
  console.error('Re-apply it as the schema owner, then re-run:');
  console.error('  docker exec -i baalvion-postgres psql -U baalvion -d baalvion_db < tests/fixtures/dealroom-seed.sql\n');
  process.exit(2);
}

console.log('\n── Happy path: investor A opens a room on a live round ──');
const opened = await call('investorA', '/deals', 'POST', { opportunity_id: OPPORTUNITY });
ok('deal opens', opened.status === 201, JSON.stringify(opened.json).slice(0, 160));
const dealId = opened.json?.data?.id;
ok('counterparty derived from the opportunity, not the client',
   opened.json?.data?.org_id_company === ORG_COMPANY, opened.json?.data?.org_id_company);

console.log('\n── Isolation: investor B is a stranger to this deal ──');
const bList = await call('investorB', '/deals');
ok('B\'s pipeline does not contain A\'s deal',
   !(bList.json?.data?.items ?? []).some((d) => d.id === dealId),
   `${(bList.json?.data?.items ?? []).length} items`);
const bRead = await call('investorB', `/deals/${dealId}`);
ok('B cannot open A\'s deal room (403/404)', bRead.status === 403 || bRead.status === 404, `status ${bRead.status}`);
const bMsg = await call('investorB', `/deals/${dealId}/messages`);
ok('B cannot read the negotiation chat', bMsg.status === 403 || bMsg.status === 404, `status ${bMsg.status}`);

console.log('\n── NDA gate ──');
const lockedDocs = await call('investorA', `/deals/${dealId}/documents`);
ok('data room is locked before the NDA', lockedDocs.status === 403, `status ${lockedDocs.status}`);

console.log('\n── ATTACK: investor grants itself data-room access (was possible) ──');
const selfGrant = await call('investorA', `/deals/${dealId}/access-grants`, 'POST',
  { grantee_org_id: ORG_INV_A, category: 'all', condition: 'approved' });
ok('self-issued access grant is refused', selfGrant.status === 403, `status ${selfGrant.status}`);
const stillLocked = await call('investorA', `/deals/${dealId}/documents`);
ok('data room is still locked after the attempt', stillLocked.status === 403, `status ${stillLocked.status}`);

const nda = await call('investorA', `/deals/${dealId}/nda`, 'POST', {});
ok('signing the NDA succeeds', nda.status === 201, `status ${nda.status}`);
const unlocked = await call('investorA', `/deals/${dealId}/documents`);
ok('data room unlocks after the NDA', unlocked.status === 200, `status ${unlocked.status}`);

console.log('\n── ATTACK: investor writes into the company data room (was possible) ──');
// Real multipart uploads — the endpoint takes bytes now, so it can magic-byte validate and scan
// them. A "document" is no longer whatever URL a caller chose to register.
const PDF = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('FY25 audited financials'), Buffer.from('\n%%EOF')]);
async function uploadDoc(who, bytes, name, type, category) {
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type }), name);
  if (category) fd.append('category', category);
  const res = await fetch(`${API}/deals/${dealId}/documents`, {
    method: 'POST', headers: { Authorization: `Bearer ${TOK[who]}` }, body: fd,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

const plant = await uploadDoc('investorA', PDF, 'planted.pdf', 'application/pdf', 'financial');
ok('investor cannot upload into the company data room', plant.status === 403, `status ${plant.status}`);
const coUpload = await uploadDoc('company', PDF, 'FY25-audited.pdf', 'application/pdf', 'financial');
ok('the company side still can', coUpload.status === 201, `status ${coUpload.status}`);
ok('the file is actually stored, not just referenced',
   !!coUpload.json?.data?.storage_key && coUpload.json?.data?.size_bytes > 0,
   JSON.stringify({ key: coUpload.json?.data?.storage_key?.slice(0, 24), size: coUpload.json?.data?.size_bytes }));

// Content is verified, not taken on trust from the declared type.
const spoof = await uploadDoc('company', Buffer.from('#!/bin/sh\nrm -rf /\n'), 'invoice.pdf', 'application/pdf', 'financial');
ok('a shell script declared as a PDF is rejected', spoof.status === 415, `status ${spoof.status}`);

// Reads are brokered and re-authorised at the moment of the read, never a bearer URL.
const docId = coUpload.json?.data?.id;
const dlOk = await fetch(`${API}/deals/${dealId}/documents/${docId}/download`, { headers: { Authorization: `Bearer ${TOK.investorA}` } });
ok('investor with an NDA grant can download it', dlOk.status === 200, `status ${dlOk.status}`);
const dlNo = await fetch(`${API}/deals/${dealId}/documents/${docId}/download`, { headers: { Authorization: `Bearer ${TOK.investorB}` } });
ok('a stranger to the deal cannot', dlNo.status === 403 || dlNo.status === 404, `status ${dlNo.status}`);

console.log('\n── ATTACK: requester closes out its own document request (was possible) ──');
const req = await call('investorA', `/deals/${dealId}/document-requests`, 'POST',
  { category: 'financial', title: 'Audited FY25 accounts' });
const reqId = req.json?.data?.id;
const selfFulfil = await call('investorA', `/deals/${dealId}/document-requests/${reqId}`, 'PATCH', { status: 'uploaded' });
ok('requester cannot mark its own request fulfilled', selfFulfil.status === 403, `status ${selfFulfil.status}`);
const coFulfil = await call('company', `/deals/${dealId}/document-requests/${reqId}`, 'PATCH', { status: 'uploaded' });
ok('the company can answer it', coFulfil.status === 200, `status ${coFulfil.status}`);
const investorSignoff = await call('investorA', `/deals/${dealId}/document-requests/${reqId}`, 'PATCH', { status: 'approved' });
ok('and the requester signs it off', investorSignoff.status === 200, `status ${investorSignoff.status}`);
const coSignoff = await call('company', `/deals/${dealId}/document-requests/${reqId}`, 'PATCH', { status: 'rejected' });
ok('company cannot sign off on the requester\'s behalf', coSignoff.status === 403, `status ${coSignoff.status}`);

console.log('\n── ATTACK: forge a deal against an org of your choosing (was possible) ──');
const forged = await call('investorB', '/deals', 'POST',
  { opportunity_id: OPPORTUNITY, org_id_company: ORG_INV_A });
ok('client-supplied counterparty is ignored',
   forged.status !== 201 || forged.json?.data?.org_id_company === ORG_COMPANY,
   JSON.stringify(forged.json?.data?.org_id_company));

// investor B opened its own room earlier in the forged-counterparty check; reuse it.
const bDeals = await call('investorB2', '/deals');
const dealB = bDeals.json?.data?.items?.[0]?.id;
console.log('\n── Round terms are enforced ──');
const belowMin = await call('investorB2', `/deals/${dealB}/term-sheets`, 'POST',
  { amount: 1000, equity_pct: 1, valuation: 10000000, note: 'below the advertised minimum' });
ok('term sheet below the round minimum is refused', belowMin.status === 409, `status ${belowMin.status}`);

console.log('\n── ATTACK: jump the lifecycle straight to closed (was possible) ──');
const jump = await call('investorA', `/deals/${dealId}`, 'PATCH', { status: 'closed' });
ok('cannot mark your own deal closed', jump.status === 403, `status ${jump.status}`);
const skip = await call('investorA', `/deals/${dealId}`, 'PATCH', { status: 'funding' });
ok('cannot skip from dd straight to funding', skip.status === 409, `status ${skip.status}`);

console.log('\n── An uncleared investor cannot put terms on the table ──');
// accreditation_status / kyc_status / aml_status existed on the investor record and gated nothing:
// an unverified party could open a room, unlock the data room and propose terms. Investor C is
// seeded with accreditation in_review and KYC pending.
const cDeal = await call('investorC', '/deals', 'POST', { opportunity_id: OPPORTUNITY });
ok('an uncleared investor may still open a room', cDeal.status === 201, `status ${cDeal.status}`);
const cTerms = await call('investorC', `/deals/${cDeal.json?.data?.id}/term-sheets`, 'POST',
  { amount: 2000000, equity_pct: 16.7, valuation: 10000000 });
ok('but is refused at the term sheet', cTerms.status === 403,
   `status ${cTerms.status} ${cTerms.json?.error?.code || ''}`);

console.log('\n── Term sheet: you cannot accept your own paper (was possible) ──');
const ts = await call('investorA', `/deals/${dealId}/term-sheets`, 'POST',
  { amount: 2000000, equity_pct: 16.7, valuation: 10000000, note: 'Opening offer' });
ok('investor proposes terms', ts.status === 201, `status ${ts.status}`);
const tsId = ts.json?.data?.id;
const selfAccept = await call('investorA', `/deals/${dealId}/term-sheets/${tsId}/versions`, 'POST',
  { action: 'accept', note: 'accepting my own offer' });
ok('proposer cannot accept its own version', selfAccept.status === 403, `status ${selfAccept.status}`);

const counter = await call('company', `/deals/${dealId}/term-sheets/${tsId}/versions`, 'POST',
  { action: 'counter', amount: 2000000, equity_pct: 14.3, valuation: 12000000, note: 'Counter' });
ok('company counters', counter.status === 200, `status ${counter.status}`);
const accept = await call('investorA', `/deals/${dealId}/term-sheets/${tsId}/versions`, 'POST',
  { action: 'accept', note: 'Agreed' });
ok('investor accepts the counter', accept.status === 200, `status ${accept.status}`);

console.log('\n── Nothing can be signed or funded without a provider ──');
// These used to be plain endpoints: a party minted its own envelope id, marked the counterparty's
// signature complete, and moved its own escrow to funded — after which compliance released it and
// equity was issued against money that never moved. With no provider configured they now refuse.
const sig = await call('investorA', `/deals/${dealId}/signatures`, 'POST', { document_type: 'spa', provider: 'docusign' });
ok('starting a signature with no e-sign provider is refused', sig.status === 503, `status ${sig.status}`);
const esc0 = await call('investorA', `/deals/${dealId}/escrow`, 'POST', { amount: 2000000, currency: 'USD' });
ok('opening escrow with no provider is refused', esc0.status === 503, `status ${esc0.status}`);

const fakeFund = await fetch(`${API.replace('/api/v1', '')}/webhooks/escrow`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-escrow-signature': 'forged' },
  body: JSON.stringify({ event: 'escrow.funded', escrow_ref: 'anything' }),
});
ok('an unsigned funding webhook is rejected', fakeFund.status === 401, `status ${fakeFund.status}`);

console.log('\n── Cap table never exceeds 100% ──');
const cap = await call('compliance', `/companies/11111111-0000-4000-8000-000000000001/cap-table`);
const entries = cap.json?.data?.entries ?? [];
const total = entries.reduce((t, e) => t + Number(e.ownership_pct || 0), 0);
ok('ownership never exceeds 100%', total <= 100.0001, `total = ${total.toFixed(4)}%`);
// issueOwnership is covered directly by the dilution unit test; end to end it now requires a
// funded escrow, which requires a real provider.

console.log('\n── No shared fallback org: an org-less identity cannot onboard ──');
const orglessCompany = await call('orgless', '/companies', 'POST',
  { legal_name: 'Ghost Holdings Ltd', country: 'IN', stage: 'startup' });
ok('company onboarding refuses an org-less caller', orglessCompany.status === 403, `status ${orglessCompany.status}`);
const orglessInvestor = await call('orgless', '/investors', 'POST',
  { legal_name: 'Ghost Capital', type: 'vc', country: 'IN' });
ok('investor onboarding refuses an org-less caller', orglessInvestor.status === 403, `status ${orglessInvestor.status}`);
// /deals sits behind the canonical verifier, which lists org_id as a required claim — so an
// org-less token is rejected at authentication (401 MISSING_CLAIM) before the service guard.
// Onboarding uses optionalAuth, so there the service guard is what answers (403 NO_ORG).
const orglessDeal = await call('orgless', '/deals', 'POST', { opportunity_id: OPPORTUNITY });
ok('deal opening refuses an org-less caller',
   orglessDeal.status === 401 || orglessDeal.status === 403, `status ${orglessDeal.status}`);

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
