'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: false,
    define: { underscored: true, schema: config.db.schema },
});

const db = { sequelize, Sequelize };
db.Tenant            = require('./tenant')(sequelize, DataTypes);
db.TenantBranding    = require('./tenantBranding')(sequelize, DataTypes);
db.TenantDomain      = require('./tenantDomain')(sequelize, DataTypes);
db.TenantEntitlement = require('./tenantEntitlement')(sequelize, DataTypes);

for (const child of ['TenantBranding', 'TenantDomain', 'TenantEntitlement']) {
    db.Tenant.hasMany(db[child], { foreignKey: 'tenant_id', as: child.replace('Tenant', '').toLowerCase() + 's' });
    db[child].belongsTo(db.Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
}

module.exports = db;
