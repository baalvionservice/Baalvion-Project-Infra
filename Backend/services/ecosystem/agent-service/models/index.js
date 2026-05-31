'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, schema: config.db.schema },
});

const db = { sequelize, Sequelize };
db.Agent           = require('./agent')(sequelize, DataTypes);
db.CommissionPlan  = require('./commissionPlan')(sequelize, DataTypes);
db.AgentSale       = require('./agentSale')(sequelize, DataTypes);
db.Commission      = require('./commission')(sequelize, DataTypes);
db.TrainingCourse  = require('./trainingCourse')(sequelize, DataTypes);
db.TrainingModule  = require('./trainingModule')(sequelize, DataTypes);
db.AgentEnrollment = require('./agentEnrollment')(sequelize, DataTypes);

db.CommissionPlan.hasMany(db.Agent, { foreignKey: 'commission_plan_id', as: 'agents' });
db.Agent.belongsTo(db.CommissionPlan, { foreignKey: 'commission_plan_id', as: 'plan' });
db.Agent.hasMany(db.AgentSale, { foreignKey: 'agent_id', as: 'sales' });
db.AgentSale.belongsTo(db.Agent, { foreignKey: 'agent_id', as: 'agent' });
db.Agent.hasMany(db.Commission, { foreignKey: 'agent_id', as: 'commissions' });
db.Commission.belongsTo(db.Agent, { foreignKey: 'agent_id', as: 'agent' });
db.TrainingCourse.hasMany(db.TrainingModule, { foreignKey: 'course_id', as: 'modules' });
db.TrainingModule.belongsTo(db.TrainingCourse, { foreignKey: 'course_id', as: 'course' });
db.TrainingCourse.hasMany(db.AgentEnrollment, { foreignKey: 'course_id', as: 'enrollments' });
db.AgentEnrollment.belongsTo(db.TrainingCourse, { foreignKey: 'course_id', as: 'course' });

module.exports = db;
