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

module.exports = db;
