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

db.Article = require('./articles')(sequelize, DataTypes);
db.AssetSummary = require('./asset_summaries')(sequelize, DataTypes);
db.CommunityPost = require('./community_posts')(sequelize, DataTypes);
db.Comment = require('./comments')(sequelize, DataTypes);
db.Vote = require('./votes')(sequelize, DataTypes);
db.CreatorProfile = require('./creator_profiles')(sequelize, DataTypes);
db.LeaderboardEntry = require('./leaderboard_entries')(sequelize, DataTypes);
db.CalculatorResult = require('./calculator_results')(sequelize, DataTypes);
db.Entity = require('./entities')(sequelize, DataTypes);
db.CommunityDebate = require('./community_debates')(sequelize, DataTypes);
db.AssetSentiment = require('./asset_sentiments')(sequelize, DataTypes);
db.WatchlistItem = require('./watchlist_items')(sequelize, DataTypes);
db.PortfolioHolding = require('./portfolio_holdings')(sequelize, DataTypes);
db.GlossaryTerm = require('./glossary_terms')(sequelize, DataTypes);
db.GlossaryExample = require('./glossary_examples')(sequelize, DataTypes);
db.GlossaryRelation = require('./glossary_relations')(sequelize, DataTypes);
db.WorldConfig = require('./world_config')(sequelize, DataTypes);

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

// Glossary: term -> examples (1:N) and term -> relations (1:N, typed graph edges).
db.GlossaryTerm.hasMany(db.GlossaryExample, { foreignKey: 'term_id', as: 'examples', onDelete: 'CASCADE' });
db.GlossaryExample.belongsTo(db.GlossaryTerm, { foreignKey: 'term_id', as: 'term' });
db.GlossaryTerm.hasMany(db.GlossaryRelation, { foreignKey: 'term_id', as: 'relations', onDelete: 'CASCADE' });
db.GlossaryRelation.belongsTo(db.GlossaryTerm, { foreignKey: 'related_id', as: 'related', constraints: false });

module.exports = db;
