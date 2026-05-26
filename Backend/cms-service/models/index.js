'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: config.env === 'development' ? (sql) => console.log('[CMS SQL]', sql) : false,
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
db.CmsMediaReference  = require('./cmsMediaReference')(sequelize, DataTypes);
db.CmsSeoRedirect     = require('./cmsSeoRedirect')(sequelize, DataTypes);

// ── Associations ─────────────────────────────────────────────────────────────

// Website → Categories, Tags, Content, Members, Redirects
db.CmsWebsite.hasMany(db.CmsCategory,      { foreignKey: 'website_id', as: 'categories' });
db.CmsWebsite.hasMany(db.CmsTag,           { foreignKey: 'website_id', as: 'tags' });
db.CmsWebsite.hasMany(db.CmsContent,       { foreignKey: 'website_id', as: 'contents' });
db.CmsWebsite.hasMany(db.CmsWebsiteMember, { foreignKey: 'website_id', as: 'members' });
db.CmsWebsite.hasMany(db.CmsSeoRedirect,   { foreignKey: 'website_id', as: 'redirects' });

db.CmsCategory.belongsTo(db.CmsWebsite, { foreignKey: 'website_id', as: 'website' });
db.CmsTag.belongsTo(db.CmsWebsite,      { foreignKey: 'website_id', as: 'website' });
db.CmsContent.belongsTo(db.CmsWebsite,  { foreignKey: 'website_id', as: 'website' });

// Self-referential: Category parent/children
db.CmsCategory.belongsTo(db.CmsCategory,   { foreignKey: 'parent_id', as: 'parent' });
db.CmsCategory.hasMany(db.CmsCategory,     { foreignKey: 'parent_id', as: 'children' });

// Content → Category, Revisions, Workflow, Media refs
db.CmsContent.belongsTo(db.CmsCategory,       { foreignKey: 'category_id', as: 'category' });
db.CmsContent.hasMany(db.CmsContentRevision,  { foreignKey: 'content_id', as: 'revisions' });
db.CmsContent.hasOne(db.CmsWorkflow,          { foreignKey: 'content_id', as: 'workflow' });
db.CmsContent.hasMany(db.CmsMediaReference,   { foreignKey: 'content_id', as: 'mediaRefs' });

// Workflow → ApprovalLogs
db.CmsWorkflow.belongsTo(db.CmsContent,   { foreignKey: 'content_id', as: 'content' });
db.CmsWorkflow.hasMany(db.CmsApprovalLog, { foreignKey: 'workflow_id', as: 'logs' });
db.CmsApprovalLog.belongsTo(db.CmsWorkflow, { foreignKey: 'workflow_id', as: 'workflow' });

// Revisions → Content
db.CmsContentRevision.belongsTo(db.CmsContent, { foreignKey: 'content_id', as: 'content' });

// Website Members
db.CmsWebsiteMember.belongsTo(db.CmsWebsite, { foreignKey: 'website_id', as: 'website' });

// Convenience exports for services
db.Op = Sequelize.Op;

db.connectDB = async () => {
    await sequelize.authenticate();
    console.log('[CMS] Database connection established');
};

module.exports = db;
