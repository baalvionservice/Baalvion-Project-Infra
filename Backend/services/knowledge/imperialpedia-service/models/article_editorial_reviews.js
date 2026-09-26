'use strict';
const { DataTypes } = require('sequelize');

// One row per completed human editorial review/approval (Prompt 5). See migration
// 20260007-create-article-editorial-reviews.js for the field-by-field rationale. Never stores
// article title/body or full audit output — only the counts/fingerprint needed to answer
// "what did the reviewer approve, and does it still match the article?".
module.exports = (sequelize) => sequelize.define('article_editorial_reviews', {
    id:                       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    article_id:               { type: DataTypes.INTEGER, allowNull: false },
    reviewer_user_id:         { type: DataTypes.INTEGER, allowNull: false },
    reviewed_fingerprint:     { type: DataTypes.STRING(32), allowNull: false },
    audit_status_at_review:   { type: DataTypes.STRING(50), allowNull: true },
    critical_count:           { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    warning_count:            { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    suggestion_count:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    checklist_state:          { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    reviewer_note:            { type: DataTypes.TEXT, allowNull: true },
    acknowledged_critical:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approved_for_publication: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approved_at:              { type: DataTypes.DATE, allowNull: true },
}, { schema: 'imperialpedia', tableName: 'article_editorial_reviews' });
