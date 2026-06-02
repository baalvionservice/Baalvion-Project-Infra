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

/**
 * Strip SQL block comments (/* ... *‌/) and line comments (-- ...) from a SQL string
 * so that keyword checks operate on executable tokens only.
 *
 * Handles:
 *   - Nested-comment-safe stripping of / * ... * / (non-greedy, handles multi-line)
 *   - Line comments from '--' to end-of-line
 *   - Dollar-quoted string literals ($$...$$) are left intact so the stripping
 *     never removes content from a string value that contains `--` or `/* */`.
 *
 * NOTE: this is intentionally a best-effort stripping for the blocklist check.
 * The READ ONLY transaction and parameterised binding remain the primary guards.
 */
function stripSqlComments(sql) {
    let out = '';
    let i = 0;
    const len = sql.length;

    while (i < len) {
        // Block comment /* ... */
        if (sql[i] === '/' && sql[i + 1] === '*') {
            i += 2;
            while (i < len) {
                if (sql[i] === '*' && sql[i + 1] === '/') { i += 2; break; }
                i++;
            }
            out += ' '; // preserve whitespace so adjacent tokens don't merge
            continue;
        }
        // Line comment -- ... \n
        if (sql[i] === '-' && sql[i + 1] === '-') {
            while (i < len && sql[i] !== '\n') i++;
            out += ' ';
            continue;
        }
        // Single-quoted string literal — pass through verbatim (handles '... -- ...')
        if (sql[i] === "'") {
            out += sql[i++];
            while (i < len) {
                if (sql[i] === "'" && sql[i + 1] === "'") { out += "''"; i += 2; continue; } // escaped quote
                if (sql[i] === "'") { out += sql[i++]; break; }
                out += sql[i++];
            }
            continue;
        }
        // Dollar-quoted string literal $$...$$  or  $tag$...$tag$
        if (sql[i] === '$') {
            const tagMatch = sql.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
            if (tagMatch) {
                const tag = tagMatch[0]; // e.g. "$$" or "$body$"
                const end = sql.indexOf(tag, i + tag.length);
                const literal = end === -1 ? sql.slice(i) : sql.slice(i, end + tag.length);
                out += literal;
                i += literal.length;
                continue;
            }
        }
        out += sql[i++];
    }
    return out;
}

/**
 * A query is acceptable iff it is a single SELECT/WITH statement.
 *
 * Hardening over the previous guard:
 *   1. Null-byte / control-character rejection on the raw input (before any processing).
 *   2. SQL comments are stripped before every keyword/semicolon check so that
 *      comment-embedded tokens cannot bypass DML detection or embed hidden semicolons.
 *   3. The leading-keyword anchor is evaluated on the comment-stripped, whitespace-
 *      normalised text so `/* comment * / SELECT ...` is handled correctly.
 *   4. The DML keyword blocklist and the semicolon check both run on stripped text
 *      so comment bodies neither bypass blocks nor cause false positives.
 *   5. Dangerous Postgres system functions that can read/write files or cancel
 *      backends are explicitly blocked.
 *
 * The READ ONLY transaction and parameterised binding remain the primary guards;
 * this function is a defence-in-depth belt-and-braces layer.
 */
function assertReadOnly(sql) {
    // 1. Reject null bytes and other ASCII control characters (except normal whitespace).
    //    These can confuse downstream parsers and have no place in a report query.
    const raw = String(sql == null ? '' : sql);
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(raw)) {
        throw new AppError('BAD_REQUEST', 'Report queries may not contain control characters', 400);
    }

    // 2. Strip trailing semicolons on the raw input (unchanged from original behaviour).
    const rawTrimmed = raw.trim().replace(/;+\s*$/, '');
    if (!rawTrimmed) throw new AppError('BAD_REQUEST', 'Empty query', 400);

    // 3. Strip comments so all subsequent checks operate on executable tokens only.
    const stripped = stripSqlComments(rawTrimmed).trim().replace(/\s+/g, ' ');
    if (!stripped) throw new AppError('BAD_REQUEST', 'Empty query after stripping comments', 400);

    // 4. Must start with SELECT or WITH (checked on comment-stripped text).
    if (!/^(select|with)\b/i.test(stripped)) {
        throw new AppError('BAD_REQUEST', 'Report queries must be SELECT/WITH statements', 400);
    }

    // 5. No semicolons anywhere in the stripped text (statement chaining).
    if (stripped.includes(';')) {
        throw new AppError('BAD_REQUEST', 'Multiple statements are not allowed in a report query', 400);
    }

    // 6. Block DML / DDL keywords (checked on stripped text so comment bodies
    //    neither trigger false positives nor hide real DML).
    if (/\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|call|do)\b/i.test(stripped)) {
        throw new AppError('BAD_REQUEST', 'Report queries may not contain write/DDL keywords', 400);
    }

    // 7. Block dangerous Postgres system functions that can read/write files,
    //    cancel backends, or make network connections even inside a READ ONLY txn.
    //    pg_read_file / pg_read_binary_file — arbitrary file reads
    //    pg_write_file                      — arbitrary file writes
    //    lo_import / lo_export              — large-object file I/O
    //    dblink / dblink_exec               — out-of-band DB connections
    //    pg_cancel_backend / pg_terminate_backend — session manipulation
    //    pg_reload_conf / pg_rotate_logfile — server control
    if (/\b(pg_read_file|pg_read_binary_file|pg_write_file|lo_import|lo_export|dblink|dblink_exec|pg_cancel_backend|pg_terminate_backend|pg_reload_conf|pg_rotate_logfile)\s*\(/i.test(stripped)) {
        throw new AppError('BAD_REQUEST', 'Report queries may not call restricted system functions', 400);
    }

    // Return the original (pre-comment-strip) trimmed SQL so that Postgres receives
    // the full text the author wrote; only the blocklist checks used the stripped form.
    return rawTrimmed;
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
