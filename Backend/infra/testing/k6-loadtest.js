// k6 load test for the control-plane API. Run:
//   API_BASE=https://api.baalvion.com TOKEN=<jwt> k6 run k6-loadtest.js
//
// Proxy data-plane (CONNECT/SOCKS5) tunnel load is driven separately by the Go
// harness in Backend/gateway (go test -run Load) / vegeta, since k6 can't easily
// drive raw CONNECT tunnels at scale.
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errors = new Rate("errors");
const apiLatency = new Trend("api_latency_ms");

const BASE = __ENV.API_BASE || "http://localhost:4000/v1";
const TOKEN = __ENV.TOKEN || "";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

export const options = {
  scenarios: {
    steady: { executor: "ramping-vus", startVUs: 0,
      stages: [
        { duration: "1m", target: 200 },
        { duration: "3m", target: 200 },
        { duration: "1m", target: 1000 },   // spike
        { duration: "2m", target: 1000 },
        { duration: "1m", target: 0 },
      ] },
  },
  thresholds: {
    http_req_duration: ["p(95)<300", "p(99)<800"],
    errors: ["rate<0.01"],               // < 1% error budget
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const endpoints = ["/usage/realtime", "/developer/me", "/dashboard/summary", "/billing/projected-overage"];
  const url = BASE + endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url, { headers });
  apiLatency.add(res.timings.duration);
  errors.add(res.status >= 400);
  check(res, { "status 2xx/4xx (not 5xx)": (r) => r.status < 500 });
  sleep(Math.random() * 0.5);
}
