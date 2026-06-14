'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');
const { setTenantOnTransaction } = require('@baalvion/tenancy');
const { getTenantContext } = require('@baalvion/tenancy');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, freezeTableName: true, schema: config.schema },
});

const db = { Sequelize, sequelize };
db.Order = require('./orders')(sequelize, Sequelize.DataTypes);
db.OutboxEvent = require('./outbox_events')(sequelize, Sequelize.DataTypes);
db.ProcessedWebhook = require('./processed_webhooks')(sequelize, Sequelize.DataTypes);
db.OrderSagaState = require('./order_saga_state')(sequelize, Sequelize.DataTypes);
db.KycVerification = require('./kyc_verifications')(sequelize, Sequelize.DataTypes);
db.OrderPayment = require('./order_payments')(sequelize, Sequelize.DataTypes);

Object.values(db).forEach((m) => { if (m && m.associate) m.associate(db); });

// R1 GUC bridge — every transaction this service opens sets app.current_tenant /
// app.tenant_bypass from the request's ALS context, so RLS filters every row.
const origTransaction = sequelize.transaction.bind(sequelize);
sequelize.transaction = function patched(optsOrFn, maybeFn) {
    const fn = typeof optsOrFn === 'function' ? optsOrFn : maybeFn;
    const opts = typeof optsOrFn === 'function' ? undefined : optsOrFn;
    const wrapped = async (t) => {
        const ctx = getTenantContext() || {};
        await setTenantOnTransaction(sequelize, t, { tenantId: ctx.tenantId ?? null, bypass: !!ctx.bypass });
        return fn(t);
    };
    return opts ? origTransaction(opts, wrapped) : origTransaction(wrapped);
};

module.exports = db;
