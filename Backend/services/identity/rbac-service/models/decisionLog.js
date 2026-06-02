'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('decision_log', {
        id:             { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id:        { type: DataTypes.STRING(64), allowNull: true },
        tenant_id:      { type: DataTypes.UUID, allowNull: true },
        action:         { type: DataTypes.STRING(120), allowNull: true },
        resource:       { type: DataTypes.STRING(160), allowNull: true },
        scope_id:       { type: DataTypes.STRING(128), allowNull: true },
        decision:       { type: DataTypes.STRING(8), allowNull: false },
        reason:         { type: DataTypes.TEXT, allowNull: true },
        matched_policy: { type: DataTypes.STRING(120), allowNull: true },
        matched_role:   { type: DataTypes.STRING(64), allowNull: true },
        obligations:    { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
        request:        { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
        request_id:     { type: DataTypes.STRING(64), allowNull: true },
        created_at:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        sequelize, tableName: 'decision_logs', schema: 'rbac', timestamps: false, underscored: true,
    });
};
