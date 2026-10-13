'use strict';
/**
 * Database access for the order journey.
 *
 * Every journey query runs inside a transaction that first tells Postgres which organisation is
 * asking (`app.party_org`). The row-level rules in migration 089 read that value.
 *
 * Those rules only bind a connection that is NOT a superuser, and the platform's usual connection is
 * one. So this module can use a second, restricted connection (JOURNEY_DB_USER / JOURNEY_DB_PASSWORD,
 * created by scripts/create-journey-db-role.sql):
 *   - restricted connection configured  -> "database+application": Postgres enforces the rules and
 *     the queries below repeat them;
 *   - not configured                    -> "application-only": the queries below enforce the rules
 *     (they call the same tradeops.party_can function the policies use), and the status endpoint
 *     says so plainly, so nobody believes the database is protecting them when it is not.
 */
const { Sequelize, QueryTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../../config/appConfig');

let main = null;
let restricted = null;
let restrictedTried = false;

const mainPool = () => {
    if (!main) main = require('../../models').sequelize;
    return main;
};

function restrictedPool() {
    if (restricted || restrictedTried) return restricted;
    restrictedTried = true;
    const user = process.env.JOURNEY_DB_USER;
    const password = process.env.JOURNEY_DB_PASSWORD;
    if (!user || !password) return null;
    restricted = new Sequelize(config.db.name, user, password, {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        dialectOptions: { ssl: buildPgSsl() },
        logging: false,
        pool: { max: 5 },
    });
    return restricted;
}

/** Tests and tooling can supply their own connections. */
function configure({ sequelize, restrictedSequelize } = {}) {
    if (sequelize !== undefined) main = sequelize;
    if (restrictedSequelize !== undefined) { restricted = restrictedSequelize; restrictedTried = true; }
}

const pool = () => restrictedPool() || mainPool();
const enforcement = () => (restrictedPool() ? 'database+application' : 'application-only');

/** Run `fn(query, tx)` as `orgId`. `query(sql, replacements)` returns rows. */
async function withOrg(orgId, fn) {
    if (!orgId) throw new Error('withOrg: an organisation is required');
    const sq = pool();
    return sq.transaction(async (tx) => {
        await sq.query("SELECT set_config('app.party_org', :org, true)", { replacements: { org: String(orgId) }, transaction: tx });
        const query = (sql, replacements = {}) => sq.query(sql, { replacements, transaction: tx, type: QueryTypes.SELECT });
        const exec = (sql, replacements = {}) => sq.query(sql, { replacements, transaction: tx });
        return fn(query, tx, exec);
    });
}

module.exports = { withOrg, enforcement, configure, mainPool };
