// k6 production load test for trade-service. Run: k6 run bench/k6-trade.js
// Env: BASE (default http://localhost:3025), EMAIL, PASSWORD.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE = __ENV.BASE || 'http://localhost:3025';
const EMAIL = __ENV.EMAIL || 'seller@apex.demo';
const PASSWORD = __ENV.PASSWORD || 'demo1234';

const listLatency = new Trend('list_latency_ms');
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    browse: { executor: 'ramping-vus', startVUs: 0, stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 200 },   // sustained concurrent trade browsing
      { duration: '30s', target: 0 },
    ] },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],   // 95% of requests under 800ms
    errors: ['rate<0.01'],              // <1% errors
  },
};

export function setup() {
  const res = http.post(`${BASE}/v1/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('data.accessToken') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };
  const endpoints = [
    `${BASE}/v1/marketplace_listings`,
    `${BASE}/v1/orders`,
    `${BASE}/v1/rfqs?status=open`,
    `${BASE}/v1/platform_stats`,
  ];
  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url, { headers });
  listLatency.add(res.timings.duration);
  errorRate.add(res.status >= 400);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(Math.random() * 1);
}
