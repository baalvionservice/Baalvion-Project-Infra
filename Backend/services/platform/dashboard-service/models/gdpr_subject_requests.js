'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('GdprSubjectRequest', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    request_key: { type: DataTypes.STRING(50), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: true },
    subject_name: { type: DataTypes.STRING(255), allowNull: false },
    submitted_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pending' },
    due_date: { type: DataTypes.DATE, allowNull: true },
}, { schema: 'dashboard', tableName: 'gdpr_subject_requests', underscored: true, timestamps: true });
