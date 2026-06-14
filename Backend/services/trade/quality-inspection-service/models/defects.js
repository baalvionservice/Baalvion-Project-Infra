'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Defect', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    inspection_id: { type: DataTypes.UUID, allowNull: false },
    severity: { type: DataTypes.ENUM('critical', 'major', 'minor'), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    qty: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { schema: 'quality', tableName: 'defects', underscored: true, timestamps: true });
