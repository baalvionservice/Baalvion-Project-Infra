#!/usr/bin/env node
// Post-deploy verification that can actually fail.
//
// The step this replaces could not fail under any circumstance. It carried
// `continue-on-error: true`, and its loop only ever PRINTED the status code:
//
//     code=$(curl -s -o /dev/null -w '%{http_code}' ... || echo "000")
//     echo "  $url -> $code"
//
// `code=$(...)` succeeds whatever curl returns, so a 500, a connection refusal, or
// a totally dead box all reported a green deploy. Combined with there being no
// rollback anywhere in the pipeline, a bad roll stayed live and silent.
//
//   node scripts/smoke-check.mjs <url> [url...]
//
// Options:
//   --retries N     attempts per URL before giving up (default 6)
//   --delay MS      wait between attempts (default 5000)
//   --expect CODES  comma-separated acceptable statuses (default 200,204)
//   --timeout MS    per-request timeout (default 10000)
//
// Exits 0 only when EVERY url answered with an accepted status.

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};

const RETRIES = Number(opt('retries', 6));
const DELAY = Number(opt('delay', 5000));
const TIMEOUT = Number(opt('timeout', 10000));
const EXPECT = String(opt('expect', '200,204')).split(',').map((s) => s.trim());

const urls = args.filter((a, i) => {
  if (a.startsWith('--')) return false;
  return !args[i - 1]?.startsWith('--');
});

if (!urls.length) {
  console.error('usage: smoke-check.mjs <url> [url...] [--retries N] [--delay MS] [--expect 200,204]');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    let status = '000';
    let detail = '';
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), redirect: 'manual' });
      status = String(res.status);
    } catch (err) {
      detail = ` (${err.name === 'TimeoutError' ? `no response in ${TIMEOUT}ms` : err.message})`;
    }
    if (EXPECT.includes(status)) {
      console.log(`  ok    ${url} -> ${status}${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
      return true;
    }
    // A container that is still coming up is normal for the first few attempts —
    // only the final attempt is a real failure.
    const last = attempt === RETRIES;
    console.log(`  ${last ? 'FAIL' : 'wait'}  ${url} -> ${status}${detail}${last ? '' : `, retrying in ${DELAY}ms`}`);
    if (!last) await sleep(DELAY);
  }
  return false;
}

const results = [];
for (const url of urls) results.push([url, await probe(url)]);

const failed = results.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(
    `\nsmoke check FAILED: ${failed.length}/${results.length} endpoint(s) never returned ${EXPECT.join(' or ')}:\n` +
      failed.map(([u]) => `  ${u}`).join('\n') +
      `\n\nThe deploy is live but not serving. Roll back.\n`,
  );
  process.exit(1);
}

console.log(`\nsmoke check passed — ${results.length}/${results.length} endpoints healthy.`);
