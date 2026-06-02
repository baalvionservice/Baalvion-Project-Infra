'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('role_permission', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        role_id:       { type: DataTypes.UUID, allowNull: false },
        permission_id: { type: DataTypes.UUID, allowNull: false },
        effect:        { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'allow' },
        constraints:   { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:    { type: DataTypes.STRING(64), allowNull: true },
    }, {
        sequelize, tableName: 'role_permissions', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['role_id', 'permission_id'] }],
    });
};
