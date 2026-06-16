'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: false,
    define: { schema: config.schema, underscored: true },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Core domain models (the remaining 24 tables exist in the migration and are added as the
// matching modules are implemented per the roadmap).
db.Company = require('./company')(sequelize, Sequelize.DataTypes);
db.CompanyProfile = require('./companyProfile')(sequelize, Sequelize.DataTypes);
db.Founder = require('./founder')(sequelize, Sequelize.DataTypes);
db.CompanyDocument = require('./companyDocument')(sequelize, Sequelize.DataTypes);
db.Investor = require('./investor')(sequelize, Sequelize.DataTypes);
db.InvestorProfile = require('./investorProfile')(sequelize, Sequelize.DataTypes);
db.InvestmentPreference = require('./investmentPreference')(sequelize, Sequelize.DataTypes);
db.Opportunity = require('./opportunity')(sequelize, Sequelize.DataTypes);
db.Deal = require('./deal')(sequelize, Sequelize.DataTypes);
Object.assign(db, require('./dealroom')(sequelize, Sequelize.DataTypes));

// Associations
db.Opportunity.belongsTo(db.Company, { foreignKey: 'company_id', as: 'company' });
db.Company.hasMany(db.Opportunity, { foreignKey: 'company_id', as: 'opportunities' });
db.InvestmentPreference.belongsTo(db.Investor, { foreignKey: 'investor_id' });

module.exports = db;
