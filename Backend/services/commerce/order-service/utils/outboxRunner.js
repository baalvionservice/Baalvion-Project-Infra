'use strict';
// Adapts a Sequelize connection (or an open transaction) to the @baalvion/events PgQueryRunner
// shape `{ query(sql, params) => { rows } }`, so an outbox enqueue can commit atomically inside
// the caller's transaction. Shared by every outbox this service owns (ledgerOutbox.js,
// cartEventsOutbox.js) — extracted here after the second call site made the duplication real.
const { sequelize } = require('../models');

function makeOutboxRunner(t) {
    return {
        query: async (text, params) => {
            const [rows] = await sequelize.query(text, { bind: params, ...(t ? { transaction: t } : {}) });
            return { rows: Array.isArray(rows) ? rows : [] };
        },
    };
}

module.exports = { makeOutboxRunner };
