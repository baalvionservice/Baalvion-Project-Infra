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
db.Page = require('./pages')(sequelize);
db.TeamMember = require('./team_members')(sequelize);
db.NewsPost = require('./news_posts')(sequelize);
db.Faq = require('./faqs')(sequelize);
db.ContactSubmission = require('./contact_submissions')(sequelize);

// No cross-model associations needed for this service

module.exports = db;
