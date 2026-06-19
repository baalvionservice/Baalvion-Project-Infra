'use strict';
/**
 * Dependency-free concurrent load benchmark for trade-service. Runs REAL HTTP
 * against a live instance and reports throughput + latency percentiles.
 *   node bench/loadtest.js            (defaults to http://localhost:3025)
 *   BENCH_BASE=https://api... node bench/loadtest.js
 */
const BASE = process.env.BENCH_BASE || 'http://localhost:3025';

async function bench(name, fn, { requests = 400, concurrency = 40 } = {}) {
    const lat = [];
    let errors = 0;
    let idx = 0;
    const worker = async () => {
        while (idx < requests) {
            idx += 1;
            const t = process.hrtime.bigint();
            try { if (!(await fn())) errors += 1; } catch { errors += 1; }
            lat.push(Number(process.hrtime.bigint() - t) / 1e6);
        }
    };
    const start = Date.now();
    await Promise.all(Array.from({ length: concurrency }, worker));
    const secs = (Date.now() - start) / 1000;
    lat.sort((a, b) => a - b);
    const pct = (p) => (lat[Math.min(lat.length - 1, Math.floor((p / 100) * lat.length))] || 0).toFixed(1);
    console.log(
        `${name.padEnd(34)} n=${requests} c=${concurrency} | ok=${requests - errors} err=${errors}`
        + ` | ${(requests / secs).toFixed(0)} req/s | p50=${pct(50)} p95=${pct(95)} p99=${pct(99)} max=${(lat[lat.length - 1] || 0).toFixed(1)}ms`,
    );
}

(async () => {
    const login = await (await fetch(`${BASE}/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'seller@apex.demo', password: 'demo1234' }) })).json();
    const token = login.data && login.data.accessToken;
    const H = { Authorization: `Bearer ${token}` };
    console.log(`\nBaalvion trade-service load benchmark @ ${BASE}\n${'='.repeat(60)}`);

    await bench('GET /health/ready', async () => (await fetch(`${BASE}/health/ready`)).ok, { requests: 600, concurrency: 60 });
    await bench('GET /v1/marketplace_listings', async () => (await fetch(`${BASE}/v1/marketplace_listings`, { headers: H })).ok, { requests: 600, concurrency: 60 });
    await bench('GET /v1/orders (tenant-scoped)', async () => (await fetch(`${BASE}/v1/orders`, { headers: H })).ok, { requests: 600, concurrency: 60 });
    await bench('GET /v1/rfqs (indexed)', async () => (await fetch(`${BASE}/v1/rfqs?status=open`, { headers: H })).ok, { requests: 600, concurrency: 60 });
    await bench('GET /v1/alerts (store+filter)', async () => (await fetch(`${BASE}/v1/alerts?status=active`, { headers: H })).ok, { requests: 400, concurrency: 40 });
    await bench('GET /v1/platform_stats (aggregate)', async () => (await fetch(`${BASE}/v1/platform_stats`, { headers: H })).ok, { requests: 300, concurrency: 30 });
    await bench('POST /v1/auth/login (bcrypt flood)', async () => (await fetch(`${BASE}/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'seller@apex.demo', password: 'demo1234' }) })).ok, { requests: 60, concurrency: 10 });
    await bench('GET /v1/fx/rates (live+breaker)', async () => (await fetch(`${BASE}/v1/fx/rates?base=USD&target=EUR`)).ok, { requests: 40, concurrency: 8 });

    console.log(`${'='.repeat(60)}\nNote: numbers are from a single-node dev instance (local Postgres,\nSQL logging on). Production with pooling + logging off will be faster.\n`);
    process.exit(0);
})();
