#!/usr/bin/env node
// Load smoke gate. Points autocannon at a RUNNING service and fails the build when a route
// answers non-2xx or its p99 latency crosses a per-route budget.
//
// This is a regression tripwire, not a benchmark. It exists to catch the class of change
// that turns a 20 ms route into a 2 s one — a dropped index, an N+1 introduced behind a
// helper, a synchronous call added to a hot path — on a runner where absolute numbers are
// meaningless. Budgets are therefore set roughly an order of magnitude above the measured
// local p99 (see .github/workflows/e2e.yml for the values in use and how they were picked).
//
// Usage:
//   node scripts/perf-smoke.mjs --base http://127.0.0.1:3008 \
//     --route '/health=400' \
//     --route 'POST /api/v1/business-applications=2000' --body-file perf-body.json
//
// Each --route is `[METHOD ]path=budgetMs`; METHOD defaults to GET. --body-file supplies the
// JSON body shared by every POST route. --duration and --connections tune the load.

import { readFileSync } from 'node:fs';
import autocannon from 'autocannon';

function parseArgs(argv) {
  const out = { base: '', routes: [], duration: 5, connections: 10, bodyFile: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return v;
    };
    if (arg === '--base') out.base = value().replace(/\/$/, '');
    else if (arg === '--route') out.routes.push(value());
    else if (arg === '--duration') out.duration = Number(value());
    else if (arg === '--connections') out.connections = Number(value());
    else if (arg === '--body-file') out.bodyFile = value();
    else throw new Error(`unknown argument ${arg}`);
  }
  return out;
}

/** `POST /a/b=1500` -> { method:'POST', path:'/a/b', budgetMs:1500 } */
function parseRoute(spec) {
  const eq = spec.lastIndexOf('=');
  if (eq === -1) throw new Error(`route "${spec}" is missing its =budgetMs`);
  const budgetMs = Number(spec.slice(eq + 1));
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) throw new Error(`route "${spec}" has a bad budget`);
  const left = spec.slice(0, eq).trim();
  const space = left.indexOf(' ');
  const method = space === -1 ? 'GET' : left.slice(0, space).toUpperCase();
  const path = space === -1 ? left : left.slice(space + 1).trim();
  return { method, path, budgetMs };
}

/**
 * A single request before the load starts. Two reasons: a target that is down must fail with
 * "connection refused", not with a latency figure nobody can interpret; and the first hit to
 * a Node process pays JIT and connection-pool warmup that would otherwise land in p99.
 */
async function warm(url, method, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body } : {}),
    });
  } catch (err) {
    // fetch's own message is just "fetch failed"; the URL is the only useful part.
    throw new Error(`cannot reach ${method} ${url} — ${err.cause?.code ?? err.message}`);
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`warmup ${method} ${url} answered ${res.status} — the target is not healthy`);
  }
  await res.arrayBuffer();
}

const run = (opts) =>
  new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => (err ? reject(err) : resolve(result)));
  });

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.base) throw new Error('--base is required');
  if (args.routes.length === 0) throw new Error('at least one --route is required');
  const body = args.bodyFile ? readFileSync(args.bodyFile, 'utf8') : undefined;

  console.log(
    `perf-smoke: ${args.base} · ${args.connections} connections · ${args.duration}s per route\n`,
  );

  const rows = [];
  for (const spec of args.routes) {
    const { method, path, budgetMs } = parseRoute(spec);
    const url = `${args.base}${path}`;
    const sendBody = method === 'GET' || method === 'HEAD' ? undefined : body;

    await warm(url, method, sendBody);

    const result = await run({
      url,
      method,
      connections: args.connections,
      duration: args.duration,
      ...(sendBody ? { headers: { 'Content-Type': 'application/json' }, body: sendBody } : {}),
    });

    // autocannon counts every 1xx/3xx/4xx/5xx as non2xx. On these routes anything but 2xx is
    // a failure — including 429, which means the service's own IP rate limiter is the thing
    // being measured rather than the route.
    const failures = [];
    if (result.non2xx > 0) failures.push(`${result.non2xx} non-2xx`);
    if (result.errors > 0) failures.push(`${result.errors} errors`);
    if (result.timeouts > 0) failures.push(`${result.timeouts} timeouts`);
    if (result.latency.p99 > budgetMs) failures.push(`p99 ${result.latency.p99}ms > ${budgetMs}ms`);

    rows.push({
      route: `${method} ${path}`,
      rps: Math.round(result.requests.average),
      p50: result.latency.p50,
      p99: result.latency.p99,
      budgetMs,
      non2xx: result.non2xx,
      failures,
    });
  }

  const width = Math.max(...rows.map((r) => r.route.length), 5);
  console.log(
    `${'ROUTE'.padEnd(width)}  ${'RPS'.padStart(7)}  ${'p50'.padStart(7)}  ${'p99'.padStart(7)}  ${'BUDGET'.padStart(7)}  ${'NON2XX'.padStart(6)}  RESULT`,
  );
  for (const r of rows) {
    console.log(
      `${r.route.padEnd(width)}  ${String(r.rps).padStart(7)}  ${`${r.p50}ms`.padStart(7)}  ${`${r.p99}ms`.padStart(7)}  ${`${r.budgetMs}ms`.padStart(7)}  ${String(r.non2xx).padStart(6)}  ${r.failures.length ? `FAIL — ${r.failures.join(', ')}` : 'ok'}`,
    );
  }

  const failed = rows.filter((r) => r.failures.length > 0);
  if (failed.length > 0) {
    console.error(`\nperf-smoke FAILED on ${failed.length} of ${rows.length} route(s).`);
    process.exit(1);
  }
  console.log(`\nperf-smoke passed: ${rows.length} route(s) within budget.`);
}

main().catch((err) => {
  console.error(`perf-smoke: ${err.message}`);
  process.exit(1);
});
