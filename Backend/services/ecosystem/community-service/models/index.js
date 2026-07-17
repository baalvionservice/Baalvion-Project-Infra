'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.Community = require('./community')(sequelize);
db.CommunityMembership = require('./community_membership')(sequelize);
db.CommunityInvite = require('./community_invite')(sequelize);
db.CommunityJoinRequest = require('./community_join_request')(sequelize);
db.CommunityModerationLog = require('./community_moderation_log')(sequelize);
db.CommunityBillingWebhookEvent = require('./community_billing_webhook_event')(sequelize);

// Associations
db.Community.hasMany(db.CommunityMembership, { foreignKey: 'community_id', as: 'memberships' });
db.CommunityMembership.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityInvite, { foreignKey: 'community_id', as: 'invites' });
db.CommunityInvite.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityJoinRequest, { foreignKey: 'community_id', as: 'joinRequests' });
db.CommunityJoinRequest.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

db.Community.hasMany(db.CommunityModerationLog, { foreignKey: 'community_id', as: 'moderationLogs' });
db.CommunityModerationLog.belongsTo(db.Community, { foreignKey: 'community_id', as: 'community' });

module.exports = db;
