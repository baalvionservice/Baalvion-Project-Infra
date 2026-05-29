'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Note', {
    id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:       { type: DataTypes.UUID, allowNull: false },
    candidate_id: { type: DataTypes.BIGINT, allowNull: false },
    author_id:    { type: DataTypes.BIGINT, allowNull: true },
    author_name:  { type: DataTypes.STRING(255), allowNull: true },
    content:      { type: DataTypes.TEXT, allowNull: false },
}, { schema: 'jobs', tableName: 'notes', underscored: true, timestamps: true });
