'use strict';
module.exports = (sequelize, DataTypes) => {
    const AuditLog = sequelize.define('AuditLog', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        actor_id: { type: DataTypes.TEXT, allowNull: true },
        actor_email: { type: DataTypes.STRING(255), allowNull: true },
        action: { type: DataTypes.STRING(50), allowNull: false, comment: 'create | update | delete | verify | suspend | activate | refund | publish | archive | broadcast | status' },
        resource: { type: DataTypes.STRING(60), allowNull: false },
        resource_id: { type: DataTypes.STRING(60), allowNull: true },
        changes: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'legal',
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });
    return AuditLog;
};
