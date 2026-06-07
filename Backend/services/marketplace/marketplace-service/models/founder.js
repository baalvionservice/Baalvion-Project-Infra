'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Founder', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    company_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    role: { type: DataTypes.STRING(120) },
    email: { type: DataTypes.STRING(255) },
    linkedin: { type: DataTypes.STRING(300) },
    equity_pct: { type: DataTypes.DECIMAL(6, 3) },
    bio: { type: DataTypes.TEXT },
}, { schema: 'marketplace', tableName: 'founders', underscored: true, timestamps: false });
