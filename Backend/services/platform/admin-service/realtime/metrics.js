'use strict';
/**
 * Collectors for the admin console's Infrastructure panel.
 *
 * Every field is read from a real source. Where a source is unavailable the field comes back
 * null and the console renders a dash — a plausible-looking number would be worse than no
 * number on a panel operators use to decide whether the platform is healthy.
 *
 * CPU is sampled by differencing os.cpus() times between calls rather than using loadavg,
 * which is a queue length, not a percentage, and reads far above 100% on a busy box.
 */
const os = require('os');
const fs = require('fs');

let prevCpu = null;

function cpuPercent() {
  const cur = os.cpus().reduce((a, c) => {
    for (const k of Object.keys(c.times)) a[k] = (a[k] || 0) + c.times[k];
    return a;
  }, {});
  if (!prevCpu) { prevCpu = cur; return null; }   // first call has no interval to difference
  const dIdle  = cur.idle - prevCpu.idle;
  const dTotal = Object.keys(cur).reduce((s, k) => s + (cur[k] - prevCpu[k]), 0);
  prevCpu = cur;
  if (dTotal <= 0) return null;
  return Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100));
}

/**
 * Container memory, not host memory. os.totalmem() reports the host's RAM even inside a
 * container, so on this box it would describe a machine the service cannot actually use.
 * cgroup v2 first, then v1, then host as a last resort.
 */
function memoryPercent() {
  const read = (p) => { try { return fs.readFileSync(p, 'utf8').trim(); } catch { return null; } };
  const cur = read('/sys/fs/cgroup/memory.current');
  const max = read('/sys/fs/cgroup/memory.max');
  if (cur && max && max !== 'max') return (Number(cur) / Number(max)) * 100;
  const cur1 = read('/sys/fs/cgroup/memory/memory.usage_in_bytes');
  const max1 = read('/sys/fs/cgroup/memory/memory.limit_in_bytes');
  // v1 reports an absurd sentinel (~8 EiB) rather than "max" when no limit is set.
  if (cur1 && max1 && Number(max1) < Number.MAX_SAFE_INTEGER) return (Number(cur1) / Number(max1)) * 100;
  const total = os.totalmem();
  return total ? ((total - os.freemem()) / total) * 100 : null;
}

function diskPercent() {
  try {
    const s = fs.statfsSync('/');
    const total = s.blocks * s.bsize;
    return total ? ((total - s.bfree * s.bsize) / total) * 100 : null;
  } catch { return null; }
}

function parseInfo(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

async function redisMetrics(client) {
  if (!client) return null;
  try {
    const info = parseInfo(await client.info());
    const hits   = Number(info.keyspace_hits);
    const misses = Number(info.keyspace_misses);
    const total  = hits + misses;
    // Keys live in per-db lines: "db0:keys=42,expires=1,avg_ttl=0".
    let keyCount = 0;
    for (const [k, v] of Object.entries(info)) {
      if (/^db\d+$/.test(k)) {
        const m = /keys=(\d+)/.exec(v);
        if (m) keyCount += Number(m[1]);
      }
    }
    return {
      keyCount,
      // No traffic yet means no ratio to report — 0% would read as a broken cache.
      hitRate: total > 0 ? (hits / total) * 100 : null,
      memoryMb: info.used_memory ? Number(info.used_memory) / 1048576 : null,
      connectedClients: info.connected_clients ? Number(info.connected_clients) : null,
    };
  } catch { return null; }
}

async function postgresMetrics(sequelize) {
  if (!sequelize) return null;
  try {
    const [[row]] = await sequelize.query(`
      SELECT
        (SELECT count(*)::int FROM pg_stat_activity WHERE datname = current_database())              AS connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')                        AS max_connections,
        (SELECT count(*)::int FROM pg_stat_activity
           WHERE datname = current_database() AND state = 'active' AND pid <> pg_backend_pid())      AS active_queries,
        (SELECT CASE WHEN pg_is_in_recovery()
                     THEN COALESCE(EXTRACT(EPOCH FROM now() - pg_last_xact_replay_timestamp()), 0)
                     ELSE 0 END)::float                                                              AS replication_lag
    `);
    return {
      connections:    row.connections,
      maxConnections: row.max_connections,
      activeQueries:  row.active_queries,
      replicationLag: Number(row.replication_lag) || 0,
    };
  } catch { return null; }
}

async function collect({ redisClient, sequelize }) {
  const [redis, postgres] = await Promise.all([
    redisMetrics(redisClient),
    postgresMetrics(sequelize),
  ]);
  return {
    cpu:    cpuPercent(),
    memory: memoryPercent(),
    disk:   diskPercent(),
    // No per-interface byte accounting is collected here; the console renders these only if
    // present, and inventing them would misreport actual link utilisation.
    network: { inKbps: null, outKbps: null },
    redis:    redis    || { keyCount: null, hitRate: null, memoryMb: null, connectedClients: null },
    postgres: postgres || { connections: null, maxConnections: null, activeQueries: null, replicationLag: null },
  };
}

// Prime the CPU sampler at load. cpuPercent() needs a previous sample to difference against, so
// without this the first frame a client receives carries cpu:null, which the console renders as a
// 0% bar — indistinguishable from a genuinely idle box.
cpuPercent();

module.exports = { collect };
