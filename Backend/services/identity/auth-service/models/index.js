'use strict';
const { Sequelize, DataTypes } = require('sequelize');
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

db.User = require('./users')(sequelize, DataTypes);
db.Organization = require('./organizations')(sequelize, DataTypes);
db.TeamMember = require('./teamMembers')(sequelize, DataTypes);
db.Invitation = require('./invitations')(sequelize, DataTypes);
db.Session = require('./sessions')(sequelize, DataTypes);
db.RefreshToken = require('./refreshTokens')(sequelize, DataTypes);
db.PasswordReset = require('./passwordResets')(sequelize, DataTypes);
db.EmailVerification = require('./emailVerifications')(sequelize, DataTypes);
db.PhoneOtp = require('./phoneOtps')(sequelize, DataTypes);
db.EmailOtp = require('./emailOtps')(sequelize, DataTypes);
db.AuditLog = require('./auditLogs')(sequelize, DataTypes);

// Associations
db.User.hasMany(db.Session, { foreignKey: 'user_id' });
db.Session.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.RefreshToken, { foreignKey: 'user_id' });
db.Session.hasMany(db.RefreshToken, { foreignKey: 'session_id' });

db.Organization.hasMany(db.TeamMember, { foreignKey: 'org_id' });
db.User.hasMany(db.TeamMember, { foreignKey: 'user_id' });
db.TeamMember.belongsTo(db.User, { foreignKey: 'user_id' });
db.TeamMember.belongsTo(db.Organization, { foreignKey: 'org_id' });

db.Organization.hasMany(db.Invitation, { foreignKey: 'org_id' });

module.exports = db;
