'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('role_assignment', {
        id:         { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id:    { type: DataTypes.STRING(64), allowNull: false },
        role_id:    { type: DataTypes.UUID, allowNull: false },
        tenant_id:  { type: DataTypes.UUID, allowNull: false },
        scope_type: { type: DataTypes.STRING(20), allowNull: false },
        scope_id:   { type: DataTypes.STRING(128), allowNull: false, defaultValue: '*' },
        granted_by: { type: DataTypes.STRING(64), allowNull: true },
        status:     { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        expires_at: { type: DataTypes.DATE, allowNull: true },
        attributes: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata:   { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        sequelize, tableName: 'role_assignments', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['user_id', 'role_id', 'scope_id'] }],
    });
};
