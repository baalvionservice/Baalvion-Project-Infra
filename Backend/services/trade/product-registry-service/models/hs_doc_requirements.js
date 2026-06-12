'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('HsDocRequirement', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    hs_prefix: { type: DataTypes.TEXT, allowNull: false },
    dest_country: { type: DataTypes.CHAR(2), allowNull: false },
    doc_type: { type: DataTypes.TEXT, allowNull: false },
    mandatory: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: 'product', tableName: 'hs_doc_requirements', underscored: true, timestamps: true });
