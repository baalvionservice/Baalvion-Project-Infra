'use strict';

/**
 * Agent leaderboard. Ranks agents by a metric (sales volume, commission earned,
 * or deal count) over an optional period, joining agent identity for display.
 */

const db = require('../models');

const Q = db.Sequelize.QueryTypes;

const METRICS = {
    sales:      { table: 'agent.agent_sales', expr: 'COALESCE(SUM(s.amount),0)',  join: 's', where: "s.status = 'confirmed'" },
    deals:      { table: 'agent.agent_sales', expr: 'COUNT(s.id)',                join: 's', where: "s.status = 'confirmed'" },
    commission: { table: 'agent.commissions', expr: 'COALESCE(SUM(c.amount),0)',  join: 'c', where: "c.status <> 'reversed'" },
};

async function leaderboard({ orgScope = null, metric = 'sales', period = null, limit = 20 } = {}) {
    const m = METRICS[metric] || METRICS.sales;
    const alias = m.join;
    const conds = [m.where];
    const repl = { limit: Math.min(Number(limit) || 20, 100) };
    if (period) { conds.push(`${alias}.period = :period`); repl.period = period; }
    if (orgScope) { conds.push('a.org_id = :org'); repl.org = orgScope; }

    const sql = `
        SELECT a.id AS agent_id, a.code, a.name, a.tier, a.org_id,
               ${m.expr} AS value,
               COUNT(${alias}.id) AS records
        FROM agent.agents a
        JOIN ${m.table} ${alias} ON ${alias}.agent_id = a.id
        WHERE ${conds.join(' AND ')}
        GROUP BY a.id, a.code, a.name, a.tier, a.org_id
        ORDER BY value DESC
        LIMIT :limit`;

    const rows = await db.sequelize.query(sql, { replacements: repl, type: Q.SELECT });
    return {
        metric, period: period || 'all-time',
        rankings: rows.map((r, i) => ({ rank: i + 1, agentId: r.agent_id, code: r.code, name: r.name, tier: r.tier, value: Number(r.value), records: Number(r.records) })),
    };
}

/** A single agent's standing (rank + value) for a metric/period. */
async function agentRank({ agentId, orgScope = null, metric = 'sales', period = null }) {
    const board = await leaderboard({ orgScope, metric, period, limit: 100 });
    const entry = board.rankings.find((r) => r.agentId === agentId);
    return { metric, period: board.period, found: !!entry, ...entry };
}

module.exports = { leaderboard, agentRank, METRICS };
