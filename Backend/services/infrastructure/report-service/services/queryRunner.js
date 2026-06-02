'use strict';

/**
 * Read-only query runner. Executes a report definition's parameterized SELECT
 * against a configured datasource inside a READ ONLY transaction with a statement
 * timeout and a hard row cap. Defence-in-depth:
 *   - only a single SELECT/WITH statement is accepted (no `;`-chained statements);
 *   - named `:params` are bound as positional `$n` values (never string-interpolated);
 *   - the transaction is READ ONLY, so even a clever payload cannot write;
 *   - the query is wrapped in a LIMIT-ed subquery so result size is bounded.
 *
 * In production the datasource should point at a read replica / analytics mirror,
 * not the primary. Locally the `default` datasource is the platform DB.
 */

const { Pool } = require('pg');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const _pools = new Map();

function getPool(key = 'default') {
    const dsn = config.reports.datasources[key];
    if (!dsn) throw new AppError('BAD_REQUEST', `Unknown report datasource: ${key}`, 400);
    if (!_pools.has(key)) {
        _pools.set(key, new Pool({ connectionString: dsn, max: 4, idleTimeoutMillis: 30000 }));
    }
    return _pools.get(key);
}

/** A query is acceptable iff it is a single SELECT/WITH statement. */
function assertReadOnly(sql) {
    const trimmed = String(sql || '').trim().replace(/;+\s*$/, '');
    if (!trimmed) throw new AppError('BAD_REQUEST', 'Empty query', 400);
    if (!/^(select|with)\b/i.test(trimmed)) throw new AppError('BAD_REQUEST', 'Report queries must be SELECT/WITH statements', 400);
    if (trimmed.includes(';')) throw new AppError('BAD_REQUEST', 'Multiple statements are not allowed in a report query', 400);
    // Block obvious data-definition / data-modification keywords as a belt-and-braces measure.
    if (/\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|call|do)\b/i.test(trimmed)) {
        throw new AppError('BAD_REQUEST', 'Report queries may not contain write/DDL keywords', 400);
    }
    return trimmed;
}

/**
 * Bind named `:params` → positional `$n`. Skips Postgres `::type` casts. Throws on
 * a referenced param that was not supplied (so typos fail loudly, not silently NULL).
 */
function bindParams(sql, params = {}) {
    const values = [];
    const order = [];
    const bound = sql.replace(/(::)|:([a-zA-Z_][a-zA-Z0-9_]*)/g, (m, cast, name) => {
        if (cast) return cast; // leave `::type` casts alone
        if (!(name in params)) throw new AppError('BAD_REQUEST', `Missing report parameter: ${name}`, 400);
        order.push(name);
        values.push(params[name]);
        return `$${values.length}`;
    });
    return { sql: bound, values, order };
}

async function runQuery({ datasource = 'default', queryTemplate, params = {}, maxRows = config.reports.maxRows, timeoutMs = config.reports.statementTimeoutMs } = {}) {
    const safe = assertReadOnly(queryTemplate);
    const { sql, values } = bindParams(safe, params);
    const cap = Math.max(1, Math.min(Number(maxRows) || config.reports.maxRows, config.reports.maxRows));
    const wrapped = `SELECT * FROM ( ${sql} ) AS _report_sub LIMIT $${values.length + 1}`;
    const allValues = [...values, cap + 1];

    const pool = getPool(datasource);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SET TRANSACTION READ ONLY');
        await client.query(`SET LOCAL statement_timeout = ${Number(timeoutMs) || 30000}`);
        const result = await client.query({ text: wrapped, values: allValues });
        await client.query('COMMIT');
        const truncated = result.rows.length > cap;
        const rows = truncated ? result.rows.slice(0, cap) : result.rows;
        const columns = (result.fields || []).map((f) => f.name);
        return { columns, rows, rowCount: rows.length, truncated };
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        logger.warn({ err: err.message, datasource }, '[report-service] query failed');
        if (err instanceof AppError) throw err;
        throw new AppError('QUERY_FAILED', `Report query failed: ${err.message}`, 422);
    } finally {
        client.release();
    }
}

async function closeAll() {
    for (const pool of _pools.values()) { try { await pool.end(); } catch { /* ignore */ } }
    _pools.clear();
}

module.exports = { runQuery, assertReadOnly, bindParams, getPool, closeAll };
