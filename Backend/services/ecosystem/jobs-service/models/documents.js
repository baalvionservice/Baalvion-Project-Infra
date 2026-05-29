'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Document', {
    id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:        { type: DataTypes.UUID, allowNull: false },
    candidate_id:  { type: DataTypes.BIGINT, allowNull: true },
    document_type: { type: DataTypes.STRING(50), allowNull: true },
    file_name:     { type: DataTypes.STRING(500), allowNull: true },
    file_url:      { type: DataTypes.TEXT, allowNull: true },
    country:       { type: DataTypes.STRING(100), allowNull: true },
    issue_date:    { type: DataTypes.DATEONLY, allowNull: true },
    status: {
        type: DataTypes.STRING(24), defaultValue: 'PENDING',
        validate: { isIn: [['PENDING', 'VERIFIED', 'REJECTED', 'DELETION_REQUESTED', 'DELETED']] },
    },
    uploaded_by:   { type: DataTypes.BIGINT, allowNull: true },
}, { schema: 'jobs', tableName: 'documents', underscored: true, timestamps: true });
