'use strict';

/**
 * Destination threat intelligence. Ingests configured feeds (Spamhaus, AbuseIPDB,
 * VirusTotal, OpenPhish, TOR exit list) into destination_intel + a Redis denylist
 * (`denydest:ip:{ip}` / `denydest:domain:{d}`) that the GO GATEWAY checks before
 * connecting. Feeds are config-driven (DEST_INTEL_FEEDS) — real fetch+parse; the
 * operator supplies any API keys.
 */

const db = require('../models');
const { getRedis } = require('./redisClient');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const TTL = Number(process.env.DEST_INTEL_TTL_S || 86400);

// Default feeds (line-based plaintext). Add AbuseIPDB/VirusTotal via env w/ keys.
const DEFAULT_FEEDS = [
  { source: 'tor', kind: 'ip', category: 'tor', url: 'https://check.torproject.org/torbulkexitlist' },
  { source: 'openphish', kind: 'domain', category: 'phishing', url: 'https://openphish.com/feed.txt' },
];

function feeds() {
  if (process.env.DEST_INTEL_FEEDS) {
    try { return JSON.parse(process.env.DEST_INTEL_FEEDS); } catch (_) { /* fallthrough */ }
  }
  return DEFAULT_FEEDS;
}

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
function extractIndicator(line, kind) {
  const t = line.trim();
  if (!t || t.startsWith('#') || t.startsWith(';')) return null;
  if (kind === 'domain') {
    try { return new URL(t.includes('://') ? t : `http://${t}`).hostname.toLowerCase(); }
    catch { return t.toLowerCase().split('/')[0] || null; }
  }
  const ip = t.split(/\s+/)[0];
  return IP_RE.test(ip) ? ip : null;
}

async function ingestFeed(feed) {
  const res = await fetch(feed.url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${feed.source} HTTP ${res.status}`);
  const text = await res.text();
  const indicators = [...new Set(text.split('\n').map((l) => extractIndicator(l, feed.kind)).filter(Boolean))];

  const redis = getRedis();
  const expires = new Date(Date.now() + TTL * 1000);
  let count = 0;
  // Upsert in batches; push to Redis denylist for the gateway.
  for (let i = 0; i < indicators.length; i += 500) {
    const batch = indicators.slice(i, i + 500);
    const values = batch.map((_, j) => `(:i${i + j}, :kind, :source, :category, 100, :exp)`).join(',');
    const repl = { kind: feed.kind, source: feed.source, category: feed.category, exp: expires };
    batch.forEach((ind, j) => { repl[`i${i + j}`] = ind; });
    await db.sequelize.query(
      `INSERT INTO destination_intel (indicator, kind, source, category, score, expires_at)
       VALUES ${values}
       ON CONFLICT (indicator, source) DO UPDATE SET expires_at = EXCLUDED.expires_at, score = EXCLUDED.score`,
      { replacements: repl, type: Q.INSERT },
    ).catch((e) => logger.error('[destintel] upsert failed:', e.message));

    if (redis) {
      const pipe = redis.pipeline();
      for (const ind of batch) pipe.set(`denydest:${feed.kind}:${ind}`, feed.category, 'EX', TTL);
      await pipe.exec().catch(() => {});
    }
    count += batch.length;
  }
  return count;
}

/** Refresh all configured feeds (run on a cron). */
async function refresh() {
  let total = 0;
  for (const feed of feeds()) {
    try {
      const n = await ingestFeed(feed);
      total += n;
      logger.info(`[destintel] ${feed.source}: ${n} indicators`);
    } catch (err) {
      logger.error(`[destintel] ${feed.source} failed:`, err.message);
    }
  }
  return { total };
}

/** Node-side lookup (the gateway reads Redis directly). */
async function isBlocked(host) {
  const redis = getRedis();
  if (!redis || !host) return null;
  const kind = IP_RE.test(host) ? 'ip' : 'domain';
  const cat = await redis.get(`denydest:${kind}:${String(host).toLowerCase()}`);
  return cat || null;
}

module.exports = { refresh, isBlocked, ingestFeed };
