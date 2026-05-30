'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrNotification = sequelize.define('IrNotification', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        module_source: { type: DataTypes.STRING(64), defaultValue: 'System' },
        entity_id: { type: DataTypes.STRING(128) },
        target_roles: { type: DataTypes.JSONB, defaultValue: [] },
        status: { type: DataTypes.ENUM('Draft', 'Scheduled', 'Sent', 'Archived'), defaultValue: 'Draft' },
        scheduled_at: { type: DataTypes.DATE },
        sent_at: { type: DataTypes.DATE },
        delivery_stats: { type: DataTypes.JSONB, defaultValue: { totalRecipients: 0, deliveredCount: 0, failedCount: 0 } },
        version_history: { type: DataTypes.JSONB, defaultValue: [] },
        created_by: { type: DataTypes.INTEGER },
    }, { schema: 'ir', tableName: 'ir_notifications', underscored: true, timestamps: true });
    return IrNotification;
};
