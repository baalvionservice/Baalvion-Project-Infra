'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

// Load models
db.JobListing = require('./job_listings')(sequelize);
db.Skill = require('./skills')(sequelize);
db.JobSkill = require('./job_skills')(sequelize);
db.Candidate = require('./candidates')(sequelize);
db.Application = require('./applications')(sequelize);
db.Interview = require('./interviews')(sequelize);
db.JobStage = require('./job_stages')(sequelize);
db.College = require('./colleges')(sequelize);
db.Student = require('./students')(sequelize);
db.Placement = require('./placements')(sequelize);

// Associations
db.JobListing.belongsToMany(db.Skill, {
    through: db.JobSkill,
    foreignKey: 'job_id',
    otherKey: 'skill_id',
    as: 'skills',
});
db.Skill.belongsToMany(db.JobListing, {
    through: db.JobSkill,
    foreignKey: 'skill_id',
    otherKey: 'job_id',
    as: 'jobListings',
});

db.JobListing.hasMany(db.Application, { foreignKey: 'job_id', as: 'applications' });
db.Application.belongsTo(db.JobListing, { foreignKey: 'job_id', as: 'job' });

db.Candidate.hasMany(db.Application, { foreignKey: 'candidate_id', as: 'applications' });
db.Application.belongsTo(db.Candidate, { foreignKey: 'candidate_id', as: 'candidate' });

db.Application.hasMany(db.Interview, { foreignKey: 'application_id', as: 'interviews' });
db.Interview.belongsTo(db.Application, { foreignKey: 'application_id', as: 'application' });

db.College.hasMany(db.Student, { foreignKey: 'college_id', as: 'students' });
db.Student.belongsTo(db.College, { foreignKey: 'college_id', as: 'college' });

db.Student.hasMany(db.Placement, { foreignKey: 'student_id', as: 'placements' });
db.Placement.belongsTo(db.Student, { foreignKey: 'student_id', as: 'student' });

db.College.hasMany(db.Placement, { foreignKey: 'college_id', as: 'placements' });
db.Placement.belongsTo(db.College, { foreignKey: 'college_id', as: 'college' });

module.exports = db;
