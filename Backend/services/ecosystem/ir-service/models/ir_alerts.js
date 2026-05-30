'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrAlert = sequelize.define('IrAlert', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        message: { type: DataTypes.TEXT },
        category: { type: DataTypes.STRING(48), defaultValue: 'System' },     // CapitalCall|Distribution|NAVUpdate|Document|Governance|System
        priority: { type: DataTypes.STRING(16), defaultValue: 'Medium' },     // Low|Medium|High|Critical
        target_roles: { type: DataTypes.JSONB, defaultValue: [] },
        read: { type: DataTypes.BOOLEAN, defaultValue: false },
        action_url: { type: DataTypes.STRING(500) },
    }, { schema: 'ir', tableName: 'ir_alerts', underscored: true, timestamps: true });
    return IrAlert;
};
