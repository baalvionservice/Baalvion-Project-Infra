'use strict';
const config = require('../config/appConfig');

// Lightweight HTTP GET with timeout
async function fetchJson(url, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// Check a single service health endpoint
async function checkService(svc) {
  const start = Date.now();
  const data = await fetchJson(`${svc.url}/health`);
  const latencyMs = Date.now() - start;
  return {
    name:       svc.name,
    status:     data ? (data.status === 'ok' || data.status === 'healthy' ? 'up' : 'degraded') : 'down',
    latencyMs:  data ? latencyMs : null,
    checkedAt:  new Date().toISOString(),
  };
}

// Collect health status of all services in parallel
async function collectServiceHealth() {
  const results = await Promise.all(config.services.map(checkService));
  return results;
}

// Fetch platform stats from admin-service
async function collectPlatformStats() {
  const data = await fetchJson(config.eventBus.adminStats);
  if (!data?.data) return null;
  const s = data.data;
  return {
    activeUsers:        s.users?.total ?? 0,
    activeSessions:     s.activeSessions ?? 0,
    logins24h:          s.last24h?.logins ?? 0,
    failedLogins24h:    s.last24h?.failedLogins ?? 0,
    orgs:               s.orgs?.total ?? 0,
  };
}

module.exports = { collectServiceHealth, collectPlatformStats, fetchJson };
