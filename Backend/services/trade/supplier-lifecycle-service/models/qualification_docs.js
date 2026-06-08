'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('QualificationDoc', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    supplier_id: { type: DataTypes.UUID, allowNull: false },
    doc_type: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'), defaultValue: 'pending' },
    expires_at: { type: DataTypes.DATE },
}, { schema: 'supplier', tableName: 'qualification_docs', underscored: true, timestamps: true });
