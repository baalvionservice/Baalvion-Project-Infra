'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        dialectOptions: { ssl: buildPgSsl() },
        logging: config.env === 'development' ? (sql) => logger('sql').debug({ sql }, 'query') : false,
        define: { underscored: true, timestamps: true },
    }
);

const db = { sequelize, Sequelize };

db.CmsWebsite         = require('./cmsWebsite')(sequelize, DataTypes);
db.CmsCategory        = require('./cmsCategory')(sequelize, DataTypes);
db.CmsTag             = require('./cmsTag')(sequelize, DataTypes);
db.CmsContent         = require('./cmsContent')(sequelize, DataTypes);
db.CmsContentRevision = require('./cmsContentRevision')(sequelize, DataTypes);
db.CmsWorkflow        = require('./cmsWorkflow')(sequelize, DataTypes);
db.CmsApprovalLog     = require('./cmsApprovalLog')(sequelize, DataTypes);
db.CmsWebsiteMember   = require('./cmsWebsiteMember')(sequelize, DataTypes);
db.CmsWebsiteIntegration = require('./cmsWebsiteIntegration')(sequelize, DataTypes);
db.CmsMediaReference  = require('./cmsMediaReference')(sequelize, DataTypes);
db.CmsSeoRedirect     = require('./cmsSeoRedirect')(sequelize, DataTypes);
db.CmsAuthor          = require('./cmsAuthor')(sequelize, DataTypes);

// ── Associations ─────────────────────────────────────────────────────────────

// Website → Categories, Tags, Content, Members, Redirects
db.CmsWebsite.hasMany(db.CmsCategory,      { foreignKey: 'websiteId', as: 'categories' });
db.CmsWebsite.hasMany(db.CmsTag,           { foreignKey: 'websiteId', as: 'tags' });
db.CmsWebsite.hasMany(db.CmsContent,       { foreignKey: 'websiteId', as: 'contents' });
db.CmsWebsite.hasMany(db.CmsWebsiteMember, { foreignKey: 'websiteId', as: 'members' });
db.CmsWebsite.hasMany(db.CmsSeoRedirect,   { foreignKey: 'websiteId', as: 'redirects' });
db.CmsWebsite.hasMany(db.CmsAuthor,        { foreignKey: 'websiteId', as: 'authors' });

db.CmsAuthor.belongsTo(db.CmsWebsite,   { foreignKey: 'websiteId', as: 'website' });
db.CmsCategory.belongsTo(db.CmsWebsite, { foreignKey: 'websiteId', as: 'website' });
db.CmsTag.belongsTo(db.CmsWebsite,      { foreignKey: 'websiteId', as: 'website' });
db.CmsContent.belongsTo(db.CmsWebsite,  { foreignKey: 'websiteId', as: 'website' });

// Self-referential: Category parent/children
db.CmsCategory.belongsTo(db.CmsCategory,   { foreignKey: 'parentId', as: 'parent' });
db.CmsCategory.hasMany(db.CmsCategory,     { foreignKey: 'parentId', as: 'children' });

// Content → Category, Revisions, Workflow, Media refs
db.CmsContent.belongsTo(db.CmsCategory,       { foreignKey: 'categoryId', as: 'category' });
db.CmsContent.hasMany(db.CmsContentRevision,  { foreignKey: 'contentId', as: 'revisions' });
db.CmsContent.hasOne(db.CmsWorkflow,          { foreignKey: 'contentId', as: 'workflow' });
db.CmsContent.hasMany(db.CmsMediaReference,   { foreignKey: 'contentId', as: 'mediaRefs' });

// Workflow → ApprovalLogs
db.CmsWorkflow.belongsTo(db.CmsContent,   { foreignKey: 'contentId', as: 'content' });
db.CmsWorkflow.hasMany(db.CmsApprovalLog, { foreignKey: 'workflowId', as: 'logs' });
db.CmsApprovalLog.belongsTo(db.CmsWorkflow, { foreignKey: 'workflowId', as: 'workflow' });

// Revisions → Content
db.CmsContentRevision.belongsTo(db.CmsContent, { foreignKey: 'contentId', as: 'content' });

// Website Members
db.CmsWebsiteMember.belongsTo(db.CmsWebsite, { foreignKey: 'websiteId', as: 'website' });

// Convenience exports for services
db.Op = Sequelize.Op;

db.connectDB = async () => {
    await sequelize.authenticate();
    logger('db').info({ host: config.db.host, name: config.db.name, schema: config.db.schema }, 'database connection established');
};

module.exports = db;
