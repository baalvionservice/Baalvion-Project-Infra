'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.Article = require('./articles')(sequelize, DataTypes);
db.AssetSummary = require('./asset_summaries')(sequelize, DataTypes);
db.CommunityPost = require('./community_posts')(sequelize, DataTypes);
db.Comment = require('./comments')(sequelize, DataTypes);
db.Vote = require('./votes')(sequelize, DataTypes);
db.CreatorProfile = require('./creator_profiles')(sequelize, DataTypes);
db.LeaderboardEntry = require('./leaderboard_entries')(sequelize, DataTypes);
db.CalculatorResult = require('./calculator_results')(sequelize, DataTypes);

// Associations
// Article -> CreatorProfile (author)
db.Article.belongsTo(db.CreatorProfile, { foreignKey: 'author_id', targetKey: 'user_id', as: 'creatorProfile', constraints: false });
db.CreatorProfile.hasMany(db.Article, { foreignKey: 'author_id', sourceKey: 'user_id', as: 'articles', constraints: false });

// CommunityPost -> Comments
db.CommunityPost.hasMany(db.Comment, { foreignKey: 'post_id', as: 'comments' });
db.Comment.belongsTo(db.CommunityPost, { foreignKey: 'post_id', as: 'post' });

// Comment self-referencing (threaded)
db.Comment.hasMany(db.Comment, { foreignKey: 'parent_id', as: 'replies' });
db.Comment.belongsTo(db.Comment, { foreignKey: 'parent_id', as: 'parent' });

// Vote polymorphic (no FK constraints — handled in code)
// Vote.user_id, Vote.target_type, Vote.target_id

module.exports = db;
