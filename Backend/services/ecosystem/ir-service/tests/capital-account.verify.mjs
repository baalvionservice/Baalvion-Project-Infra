/**
 * Capital account — standalone verification harness.
 *
 * Exercises the ledger end to end against a LIVE ir-service: the operator register, issuing a
 * drawdown, recording a receipt, and the investor position that derives from them. Also replays
 * the failure modes this domain was built to prevent — an investor reading the register, a call
 * that would exceed a commitment, a receipt with no bank reference, and a receipt larger than the
 * amount called.
 *
 * Prerequisites:
 *   docker compose up -d postgres                       (baalvion-postgres, :5432)
 *   node scripts/gen-dev-jwt-keys.mjs                   (repo root — dev RS256 keypair)
 *   psql -f tests/fixtures/capital-seed.sql              (as the schema owner)
 *   PORT=3008 DB_* ... JWT_PUBLIC_KEY="$(cat docker/secrets/jwt_public_key.pem)" node index.js
 *
 * The seed leaves allocation cc0000...0002 unsettled; re-apply it between runs.
 *
 * Run: node tests/capital-account.verify.mjs
 */
import crypto from 'node:crypto'; import fs from 'node:fs';
const KEY = process.env.JWT_PRIVATE_KEY_FILE
  || new URL('../../../../../docker/secrets/jwt_private_key.pem', import.meta.url).pathname;
const PRIV = fs.readFileSync(KEY, 'utf8');
const b64=x=>Buffer.from(x).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const mint=(sub,roles)=>{const n=Math.floor(Date.now()/1e3);
 const p={sub,email:sub+'@baalvion.test',org_id:'2f81f8bf-9919-4856-82f7-ddf30663e710',sid:'s',roles,permissions:[],jti:crypto.randomUUID(),iss:'baalvion-auth',aud:'baalvion-platform',iat:n,exp:n+3600};
 const i=b64(JSON.stringify({alg:'RS256',typ:'JWT',kid:'dev'}))+'.'+b64(JSON.stringify(p));
 return i+'.'+b64(crypto.sign('RSA-SHA256',Buffer.from(i),PRIV));};
const API=(process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008')+'/api/v1';
const staff=mint('ir-ops',['admin']), inv=mint('usr_investor',['p1_institutional']);
const call=async(t,p,m='GET',b)=>{const r=await fetch(API+p,{method:m,headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});return{s:r.status,j:await r.json().catch(()=>({}))};};

let pass=0,fail=0; const ok=(n,c,d='')=>{c?(pass++,console.log('  ✔ '+n)):(fail++,console.log('  ✘ '+n+(d?'  → '+d:'')));};

// This suite settles an allocation and declares a distribution, so it is not idempotent: the
// fixture has to be re-applied between runs. Fail fast with the reason rather than reporting a
// confusing mid-suite 409.
const probe = await call(staff, '/capital/admin/register');
if (probe.s !== 200) {
  console.error(`\nCannot reach ir-service at ${API} (status ${probe.s}). Start it — see the header of this file.\n`);
  process.exit(2);
}
const outstanding = (probe.j.data || []).reduce((t, r) => t + Number(r.outstanding || 0), 0);
if (!probe.j.data?.length || outstanding <= 0) {
  console.error('\nFixture not ready — no commitment with an outstanding call to settle.');
  console.error('Re-apply it as the schema owner, then re-run:');
  console.error('  docker exec -i baalvion-postgres psql -U baalvion -d baalvion_db < tests/fixtures/capital-seed.sql');
  console.error("  (and reset the worked allocation: UPDATE ir.ir_call_allocations SET amount_received=0, status='outstanding', settlement_ref=NULL WHERE id='cc000000-0000-4000-8000-000000000002'; DELETE FROM ir.ir_distributions;)\n");
  process.exit(2);
}

console.log('\n── operator register (derived from ledgers) ──');
const reg=await call(staff,'/capital/admin/register');
ok('staff can read the register', reg.s===200, 'status '+reg.s);
const r0=(reg.j.data||[])[0];
if(r0) console.log(`    ${r0.investorName}: committed ${r0.commitmentAmount.toLocaleString()}, called ${r0.calledToDate.toLocaleString()}, paid ${r0.paidToDate.toLocaleString()}`);

console.log('\n── an investor cannot read the register ──');
const denied=await call(inv,'/capital/admin/register');
ok('non-staff refused', denied.s===403||denied.s===401, 'status '+denied.s);

console.log('\n── over-calling is refused, not clamped ──');
const over=await call(staff,'/capital/admin/calls','POST',{callPct:95,purpose:'Over-call attempt'});
ok('call exceeding remaining commitment refused', over.s===409, 'status '+over.s+' '+JSON.stringify(over.j.error||{}).slice(0,80));

console.log('\n── a receipt requires bank evidence ──');
const noRef=await call(staff,'/capital/admin/allocations/cc000000-0000-4000-8000-000000000002/settle','POST',{amount:5000000});
ok('settlement without a reference refused', noRef.s===400, 'status '+noRef.s);
const withRef=await call(staff,'/capital/admin/allocations/cc000000-0000-4000-8000-000000000002/settle','POST',{amount:5000000,settlementRef:'UTR-2026-0812-44190'});
ok('settlement with a reference recorded', withRef.s===200, 'status '+withRef.s);

console.log('\n── the same bank reference cannot post twice ──');
// A retry, a double-click or a re-run of a reconciliation job used to DOUBLE the money recorded.
const sumBefore = (await call(inv,'/capital/summary')).j.data.paidInCapital;
const dup = await call(staff,'/capital/admin/allocations/cc000000-0000-4000-8000-000000000002/settle','POST',{amount:5000000,settlementRef:'UTR-2026-0812-44190'});
ok('a duplicate reference is accepted as a no-op', dup.s===200, `status ${dup.s}`);
const sumAfter = (await call(inv,'/capital/summary')).j.data.paidInCapital;
ok('and the money did NOT double', Number(sumAfter)===Number(sumBefore), `${sumBefore} -> ${sumAfter}`);

console.log('\n── an overpayment is refused, not absorbed ──');
const over2=await call(staff,'/capital/admin/allocations/cc000000-0000-4000-8000-000000000002/settle','POST',{amount:1,settlementRef:'UTR-DUPLICATE'});
ok('receipt beyond the amount called refused', over2.s===409, 'status '+over2.s);

console.log('\n── the investor position reflects it immediately ──');
const sum=await call(inv,'/capital/summary');
const d=sum.j.data||{};
ok('paid-in now 15,000,000', Number(d.paidInCapital)===15000000, String(d.paidInCapital));
ok('outstanding back to 0', Number(d.outstanding)===0, String(d.outstanding));
console.log('\n── distributions: declared, then paid against a bank reference ──');
const zero=await call(staff,'/capital/admin/distributions','POST',{amount:0});
ok('a zero distribution is refused', zero.s===400, 'status '+zero.s);
const dec=await call(staff,'/capital/admin/distributions','POST',{amount:3000000,kind:'income'});
ok('distribution declared', dec.s===201, 'status '+dec.s);
const first=(dec.j.data&&dec.j.data.items||[])[0];
ok('apportioned by paid-in capital', !!first && Number(first.amount)>0, JSON.stringify(dec.j.data&&dec.j.data.basis));
ok('declared, not paid', !!first && first.status==='declared', first&&first.status);

const noRef2=await call(staff,`/capital/admin/distributions/${first&&first.id}/pay`,'POST',{});
ok('payment without a bank reference refused', noRef2.s===400, 'status '+noRef2.s);
const paid=await call(staff,`/capital/admin/distributions/${first&&first.id}/pay`,'POST',{settlementRef:'UTR-DIST-2026-771'});
ok('payment recorded with a reference', paid.s===200, 'status '+paid.s);
const twice=await call(staff,`/capital/admin/distributions/${first&&first.id}/pay`,'POST',{settlementRef:'UTR-DIST-2026-771'});
ok('paying the same distribution twice is refused', twice.s===409, 'status '+twice.s);

const sum2=await call(inv,'/capital/summary');
ok('the investor position now shows the distribution', Number(sum2.j.data&&sum2.j.data.distributions)>0, String(sum2.j.data&&sum2.j.data.distributions));

console.log(`\n${fail===0?'✅':'❌'}  ${pass} passed, ${fail} failed\n`);

process.exit(fail === 0 ? 0 : 1);
