'use strict';
const neo4j = require('neo4j-driver');
const config = require('./appConfig');

let driver = null;

function getDriver() {
    if (driver) return driver;
    driver = neo4j.driver(
        config.neo4j.uri,
        neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
        { maxConnectionPoolSize: config.neo4j.maxConnectionPoolSize, disableLosslessIntegers: true },
    );
    return driver;
}

// READ session (routing) — use for queries.
async function read(cypher, params = {}) {
    const session = getDriver().session({ database: config.neo4j.database, defaultAccessMode: neo4j.session.READ });
    try { const r = await session.run(cypher, params); return r.records.map((rec) => rec.toObject()); }
    finally { await session.close(); }
}
// WRITE session — use for upserts/projections.
async function write(cypher, params = {}) {
    const session = getDriver().session({ database: config.neo4j.database, defaultAccessMode: neo4j.session.WRITE });
    try { const r = await session.run(cypher, params); return r.records.map((rec) => rec.toObject()); }
    finally { await session.close(); }
}

async function verifyConnectivity() { await getDriver().verifyConnectivity(); }
async function close() { if (driver) { await driver.close(); driver = null; } }

module.exports = { getDriver, read, write, verifyConnectivity, close };
