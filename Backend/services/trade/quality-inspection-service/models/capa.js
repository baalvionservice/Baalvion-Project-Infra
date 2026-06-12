'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Capa', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    inspection_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.TEXT, allowNull: false },
    owner_id: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
    due_at: { type: DataTypes.DATE },
}, { schema: 'quality', tableName: 'capa', underscored: true, timestamps: true });
