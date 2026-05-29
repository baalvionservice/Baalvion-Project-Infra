'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host:    config.db.host,
    port:    config.db.port,
    dialect: 'postgres',
    schema:  'ctm',
    logging: config.env === 'development' ? (sql) => console.log('[SQL]', sql) : false,
    pool:    { max: 10, min: 1, acquire: 30000, idle: 10000 },
    define:  { underscored: true, timestamps: true, schema: 'ctm' },
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.companies    = require('./companies')(sequelize);
db.tasks        = require('./tasks')(sequelize);
db.submissions  = require('./submissions')(sequelize);
db.evaluations  = require('./evaluations')(sequelize);
db.badges       = require('./badges')(sequelize);
db.user_badges  = require('./user_badges')(sequelize);
db.teams        = require('./teams')(sequelize);
db.team_members = require('./team_members')(sequelize);
db.plans        = require('./plans')(sequelize);
db.subscriptions= require('./subscriptions')(sequelize);
db.activities   = require('./activities')(sequelize);
db.user_profiles  = require('./user_profiles')(sequelize);
db.notifications  = require('./notifications')(sequelize);
db.task_templates = require('./task_templates')(sequelize);
db.invoices       = require('./invoices')(sequelize);
db.system_metrics   = require('./system_metrics')(sequelize);
db.system_logs      = require('./system_logs')(sequelize);
db.system_errors    = require('./system_errors')(sequelize);
db.system_incidents = require('./system_incidents')(sequelize);
db.webhooks            = require('./webhooks')(sequelize);
db.webhook_deliveries  = require('./webhook_deliveries')(sequelize);
db.api_integrations    = require('./api_integrations')(sequelize);
db.integration_logs    = require('./integration_logs')(sequelize);
db.test_cases          = require('./test_cases')(sequelize);
db.payments            = require('./payments')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────
db.companies.hasMany(db.tasks,  { foreignKey: 'company_id', as: 'tasks' });
db.tasks.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });

db.tasks.hasMany(db.submissions, { foreignKey: 'task_id', as: 'submissions' });
db.submissions.belongsTo(db.tasks, { foreignKey: 'task_id', as: 'task' });

db.submissions.hasOne(db.evaluations, { foreignKey: 'submission_id', as: 'evaluation' });
db.evaluations.belongsTo(db.submissions, { foreignKey: 'submission_id', as: 'submission' });

db.companies.hasMany(db.teams, { foreignKey: 'company_id', as: 'teams' });
db.teams.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });

db.badges.hasMany(db.user_badges, { foreignKey: 'badge_id', as: 'user_badges' });
db.user_badges.belongsTo(db.badges, { foreignKey: 'badge_id', as: 'badge' });

db.companies.hasMany(db.subscriptions, { foreignKey: 'company_id', as: 'subscriptions' });
db.subscriptions.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });

db.companies.hasMany(db.invoices, { foreignKey: 'company_id', as: 'invoices' });
db.invoices.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });
db.subscriptions.hasMany(db.invoices, { foreignKey: 'subscription_id', as: 'invoices' });
db.invoices.belongsTo(db.subscriptions, { foreignKey: 'subscription_id', as: 'subscription' });

db.companies.hasMany(db.task_templates, { foreignKey: 'company_id', as: 'templates' });
db.task_templates.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });

db.webhooks.hasMany(db.webhook_deliveries, { foreignKey: 'webhook_id', as: 'deliveries' });
db.webhook_deliveries.belongsTo(db.webhooks, { foreignKey: 'webhook_id', as: 'webhook' });

db.submissions.hasMany(db.test_cases, { foreignKey: 'submission_id', as: 'test_cases' });
db.test_cases.belongsTo(db.submissions, { foreignKey: 'submission_id', as: 'submission' });

db.companies.hasMany(db.payments, { foreignKey: 'company_id', as: 'payments' });
db.payments.belongsTo(db.companies, { foreignKey: 'company_id', as: 'company' });
db.invoices.hasMany(db.payments, { foreignKey: 'invoice_id', as: 'payments' });
db.payments.belongsTo(db.invoices, { foreignKey: 'invoice_id', as: 'invoice' });

module.exports = db;
