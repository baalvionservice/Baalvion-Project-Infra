'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { setTenantOnTransaction, getTenantContext } = require('@baalvion/tenancy');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host, port: config.db.port, dialect: 'postgres', dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, freezeTableName: true, schema: config.schema },
});

const db = { Sequelize, sequelize };
db.Inspection = require('./inspections')(sequelize, Sequelize.DataTypes);
db.Defect = require('./defects')(sequelize, Sequelize.DataTypes);
db.Capa = require('./capa')(sequelize, Sequelize.DataTypes);
Object.values(db).forEach((m) => { if (m && m.associate) m.associate(db); });

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
