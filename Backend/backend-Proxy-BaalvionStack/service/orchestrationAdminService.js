'use strict';

/**
 * Admin control-plane for provider orchestration. Reads LIVE provider health
 * from Redis (published by the gateway orchestrator at provider:state:{name})
 * and merges it with control-plane config (providers, costs, capabilities,
 * routing policies, IP intelligence). Provider secrets are encrypted at rest.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const vault = require('./cryptoVault');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

// ── Live provider health + config ────────────────────────────────────────────
async function listProviderStates() {
  const redis = getRedis();
  const live = {};
  if (redis) {
    try {
      const names = await redis.smembers('providers:registry');
      for (const name of names) {
        const raw = await redis.get(`provider:state:${name}`);
        if (raw) live[name] = JSON.parse(raw);
      }
    } catch (err) {
      logger.error('[orch-admin] redis read failed:', err.message);
    }
  }
  const rows = await db.sequelize.query(
    `SELECT name, kind, proxy_type, cost_per_gb, weight, enabled FROM providers`,
    { type: Q.SELECT },
  ).catch(() => []);
  const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
  const names = new Set([...Object.keys(live), ...rows.map((r) => r.name)]);
  return Array.from(names).map((name) => ({
    name,
    config: byName[name] || null,
    health: live[name] || { state: 'UNKNOWN' },
  }));
}

// ── Provider credentials (encrypted) ─────────────────────────────────────────
async function setProviderCredentials(providerId, { usernameTemplate, password, apiToken, usageApiUrl }) {
  const passwordEnc = vault.encrypt(password);
  const apiTokenEnc = apiToken ? vault.encrypt(apiToken) : null;
  await db.sequelize.query(
    `INSERT INTO provider_credentials (provider_id, username_template, password_enc, api_token_enc, usage_api_url, updated_at)
     VALUES (:pid, :ut, :pw, :tok, :url, now())
     ON CONFLICT (provider_id) DO UPDATE SET
       username_template = EXCLUDED.username_template,
       password_enc = EXCLUDED.password_enc,
       api_token_enc = EXCLUDED.api_token_enc,
       usage_api_url = EXCLUDED.usage_api_url,
       rotated_at = now(), updated_at = now()`,
    { replacements: { pid: providerId, ut: usernameTemplate, pw: passwordEnc, tok: apiTokenEnc, url: usageApiUrl || null }, type: Q.INSERT },
  );
  return { providerId, rotated: true };
}

/** Decrypted provider config for gateway bootstrap (PROVIDERS_JSON generation). */
async function exportProviderConfigs() {
  const rows = await db.sequelize.query(
    `SELECT p.name, p.kind, p.address, p.cost_per_gb, p.weight, c.username_template, c.password_enc, c.api_token_enc, c.usage_api_url
     FROM providers p JOIN provider_credentials c ON c.provider_id = p.id
     WHERE p.enabled = true`,
    { type: Q.SELECT },
  );
  return rows.map((r) => ({
    name: r.name, kind: r.kind, address: r.address, weight: r.weight, costPerGb: Number(r.cost_per_gb),
    usernameTemplate: r.username_template,
    password: vault.decrypt(r.password_enc),
    apiToken: r.api_token_enc ? vault.decrypt(r.api_token_enc) : '',
    usageApiUrl: r.usage_api_url || '',
  }));
}

// ── Routing policies ─────────────────────────────────────────────────────────
async function listRoutingPolicies() {
  return db.sequelize.query(`SELECT * FROM routing_policies ORDER BY priority DESC, id`, { type: Q.SELECT });
}

async function upsertRoutingPolicy(p) {
  if (p.id) {
    await db.sequelize.query(
      `UPDATE routing_policies SET name=:name, plan_slug=:plan, strategy=:strat, country=:country,
        provider_allow=:allow::jsonb, provider_deny=:deny::jsonb, priority=:prio, enabled=:enabled, updated_at=now()
       WHERE id=:id`,
      { replacements: rp(p), type: Q.UPDATE },
    );
    return { id: p.id, updated: true };
  }
  const rows = await db.sequelize.query(
    `INSERT INTO routing_policies (name, plan_slug, strategy, country, provider_allow, provider_deny, priority, enabled)
     VALUES (:name,:plan,:strat,:country,:allow::jsonb,:deny::jsonb,:prio,:enabled) RETURNING id`,
    { replacements: rp(p), type: Q.SELECT },
  );
  return { id: rows[0].id, created: true };
}
function rp(p) {
  return {
    id: p.id || null, name: p.name, plan: p.planSlug || null, strat: p.strategy || 'cost_aware',
    country: p.country || null, allow: JSON.stringify(p.providerAllow || []), deny: JSON.stringify(p.providerDeny || []),
    prio: p.priority || 100, enabled: p.enabled !== false,
  };
}

// ── IP intelligence + coverage + sessions + ban analytics ────────────────────
async function listIpIntelligence({ provider, country, limit = 100, offset = 0 } = {}) {
  return db.sequelize.query(
    `SELECT * FROM ip_intelligence
     WHERE (:provider IS NULL OR provider = :provider) AND (:country IS NULL OR country = :country)
     ORDER BY last_seen DESC LIMIT :limit OFFSET :offset`,
    { replacements: { provider: provider || null, country: country || null, limit: Number(limit), offset: Number(offset) }, type: Q.SELECT },
  );
}

async function getGeoCoverage() {
  return db.sequelize.query(
    `SELECT country, COUNT(DISTINCT provider_id) AS providers, COUNT(*) AS entries
     FROM provider_geo_capabilities GROUP BY country ORDER BY providers DESC`,
    { type: Q.SELECT },
  );
}

async function listActiveSessions({ limit = 200 } = {}) {
  return db.sequelize.query(
    `SELECT id, org_id, api_key_id, provider, country, rotation, started_at, last_seen_at
     FROM proxy_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT :limit`,
    { replacements: { limit: Number(limit) }, type: Q.SELECT },
  ).catch(() => []);
}

async function getBanAnalytics() {
  const states = await listProviderStates();
  const recent = await db.sequelize.query(
    `SELECT event_type, severity, COUNT(*) AS n FROM abuse_logs
     WHERE created_at > now() - interval '24 hours' GROUP BY event_type, severity ORDER BY n DESC`,
    { type: Q.SELECT },
  ).catch(() => []);
  return {
    providerBanRates: states.map((s) => ({ name: s.name, banRate: s.health.banRate || 0, state: s.health.state })),
    last24h: recent,
  };
}

module.exports = {
  listProviderStates, setProviderCredentials, exportProviderConfigs,
  listRoutingPolicies, upsertRoutingPolicy,
  listIpIntelligence, getGeoCoverage, listActiveSessions, getBanAnalytics,
};
